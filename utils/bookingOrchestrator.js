const FlightBooking = require('../modules/flights/flight.model');
const Traveller = require('../modules/account/traveller.model');
const fareCache = require('./fareCache');
const srdvClient = require('../providers/srdv/srdv.client');
const logger = require('./logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * ─── BOOKING ORCHESTRATOR ─────────────────────────────
 * Coordinates multi-step flight booking process
 * 
 * Flow:
 * 1. Fetch travellers from DB
 * 2. Get cached fare from FareCache
 * 3. Verify price hasn't changed
 * 4. Call SRDV Book API → Get PNR
 * 5. Store booking with PNR
 * 6. Return booking for payment
 * 
 * All-or-nothing: If any step fails, rollback/error
 */

/**
 * Process Flight Booking
 * @param {string} userId
 * @param {object} bookingRequest - {
 *   traceId,
 *   srdvType,
 *   srdvIndex,
 *   resultIndex,
 *   isLCC,
 *   travellerIds: [id1, id2, ...],
 *   gstDetails: { optional }
 * }
 * @returns {Promise} Created FlightBooking document
 */
const processFlightBooking = async (userId, bookingRequest) => {
    try {
        const { traceId, srdvType, srdvIndex, resultIndex, isLCC, travellerIds, gstDetails } =
            bookingRequest;

        logger.info(`Starting flight booking - User: ${userId}, TraceId: ${traceId}`);

        // Step 1: Fetch travellers
        logger.info('Step 1: Fetching travellers...');
        const travellers = await Traveller.find({
            _id: { $in: travellerIds },
            userId,
        });

        if (travellers.length !== travellerIds.length) {
            throw new AppError('Some travellers not found or unauthorized', 400);
        }

        logger.info(`Found ${travellers.length} travellers`);

        // Step 2: Get cached fare from FareCache
        logger.info('Step 2: Retrieving fare from cache...');
        const cacheKey = `${traceId}_${srdvIndex}`;
        const fareEntry = fareCache.getEntry(cacheKey);

        if (!fareEntry) {
            throw new AppError('Fare not found in cache. Please search again.', 400);
        }

        const { fareData, flightInfo } = fareEntry;

        logger.info(`Fare retrieved from cache - Amount: ${fareData.fare}`);

        // Step 3: Prepare booking request for SRDV Book API
        logger.info('Step 3: Preparing SRDV Book request...');

        const srdvBookingPayload = {
            TraceId: traceId,
            SrdvType: srdvType,
            SrdvIndex: srdvIndex,
            ResultIndex: resultIndex,
            IsLCC: isLCC,
            Passengers: travellers.map((t) => ({ 
                Title: t.salutation,
                FirstName: t.firstName,
                LastName: t.lastName,
                DateOfBirth: t.dateOfBirth,
                PaxType: t.passengerType || 'ADT', // Adult, Child, Infant
                PassportNo: t.passport?.number,
                PassportExpiry: t.passport?.expiry,
                Nationality: t.nationality,
                IsLead: t._id.toString() === travellerIds[0], // First is lead
            })),
            Fare: fareData, // Fare object from FareQuote
            ...(gstDetails && { GST: gstDetails }),
        };

        // Step 4: Call SRDV Book API
        logger.info('Step 4: Calling SRDV Book API...');
        const bookingResponse = await srdvClient.post('/Book', srdvBookingPayload);

        logger.info(`SRDV Book API successful - PNR: ${bookingResponse.BookingRefNo}`);

        // Step 5: Create FlightBooking document
        logger.info('Step 5: Creating FlightBooking document...');

        const flightBooking = new FlightBooking({
            user: userId,
            traceId,
            srdvType,
            srdvIndex,
            resultIndex,
            isLCC,
            fareSnapshot: fareData,
            totalAmount: bookingResponse.TotalAmount || fareData.fare,
            markupAmount: (bookingResponse.TotalAmount || fareData.fare) - fareData.fare,
            isGstMandatory: bookingResponse.IsGSTMandatory,
            gstDetails: gstDetails,

            // Post-book response
            pnr: bookingResponse.BookingRefNo,
            srdvBookingId: bookingResponse.SrdvBookingId,
            lastTicketDate: bookingResponse.LastTicketDate,

            status: 'pending', // Awaiting payment
            remark: bookingResponse.Remark,
            passengers: travellers.map((t) => ({
                travellerId: t._id,
                isLeadPax: t._id.toString() === travellerIds[0],
            })),

            eTicketData: bookingResponse, // Full response for debugging
        });

        await flightBooking.save();

        logger.info(`FlightBooking created - ID: ${flightBooking._id}, PNR: ${flightBooking.pnr}`);

        // Step 6: Clear fare from cache (booking made)
        fareCache.delete(cacheKey);

        return flightBooking;
    } catch (error) {
        logger.error(`Flight booking failed: ${error.message}`);
        throw error;
    }
};

/**
 * Process Ticketing (after payment confirmed)
 * @param {string} bookingId - Internal booking ID
 * @returns {Promise}
 */
const processTicketing = async (bookingId) => {
    try {
        logger.info(`Processing ticketing for booking: ${bookingId}`);

        // Fetch booking
        const booking = await FlightBooking.findById(bookingId);

        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (booking.status !== 'confirmed') {
            throw new AppError('Booking must be confirmed before ticketing', 400);
        }

        // Call SRDV TicketGDS API
        logger.info(`Calling SRDV TicketGDS API for PNR: ${booking.pnr}`);

        const ticketResponse = await srdvClient.post('/TicketGDS', {
            BookingReferenceNumber: booking.pnr,
            SrdvBookingId: booking.srdvBookingId,
        });

        logger.info(`TicketGDS successful - Ticket: ${ticketResponse.TicketNumber}`);

        // Update booking with ticket details
        booking.ticketStatus = ticketResponse.TicketStatus;
        booking.passengers.forEach((pax, index) => {
            if (ticketResponse.Passengers && ticketResponse.Passengers[index]) {
                pax.ticketNumber = ticketResponse.Passengers[index].TicketNumber;
                pax.ticketId = ticketResponse.Passengers[index].TicketId;
                pax.ticketStatus = ticketResponse.Passengers[index].TicketStatus;
            }
        });

        booking.status = 'confirmed'; // Or 'ticketed'
        booking.eTicketData = ticketResponse;

        await booking.save();

        logger.info(`Booking ticketed successfully - ID: ${booking._id}`);

        return booking;
    } catch (error) {
        logger.error(`Ticketing failed: ${error.message}`);
        throw error;
    }
};

module.exports = {
    processFlightBooking,
    processTicketing,
};

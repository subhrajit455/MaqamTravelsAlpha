#!/usr/bin/env node
const dns = require('node:dns/promises');
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require('dotenv').config();
const mongoose = require('mongoose');
const logger = console;

const User = require('../modules/auth/auth.model');
const Traveller = require('../modules/account/traveller.model');
const FlightBooking = require('../modules/flights/flight.model');
const HotelBooking = require('../modules/hotels/hotel.model');
const Tour = require('../modules/tours/tour.model');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is not set in environment variables.');
    }

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
    });

    logger.log('✅ MongoDB connected');
};

const findOrCreateTestUser = async () => {
    const phone = '8294507785';
    const email = 'customer@example.com';
    let user = await User.findOne({ phone });

    if (!user) {
        user = await User.create({
            phone,
            email,
            password: 'TestPass123!',
            firstName: 'John',
            lastName: 'Customer',
            role: 'customer',
            isVerified: true,
        });
        logger.log(`✅ Created test user: ${phone}`);
    } else {
        logger.log(`ℹ️  Found existing user: ${phone}`);
    }

    return user;
};

const findOrCreateTraveller = async (user) => {
    const existingTraveller = await Traveller.findOne({
        userId: user._id,
        firstName: 'John',
        lastName: 'Customer',
    });

    if (existingTraveller) {
        logger.log('ℹ️  Found existing traveller for test user');
        return existingTraveller;
    }

    const traveller = await Traveller.create({
        userId: user._id,
        passengerType: 'Adult',
        title: 'Mr',
        firstName: 'John',
        lastName: 'Customer',
        nationality: 'Indian',
        gender: 'Male',
        dateOfBirth: new Date('1990-01-01'),
        email: 'customer@example.com',
        phone: '8294507785',
        cellCountryCode: '+91',
        addressLine1: '123 Test Street',
        city: 'Mumbai',
        countryCode: 'IN',
        countryName: 'INDIA',
        passportNo: 'A1234567',
        passportExpiry: new Date('2030-12-31'),
        passportIssueCountryCode: 'IN',
        passportIssueDate: new Date('2020-01-01'),
        documentType: 'Passport',
        documentId: 'A1234567',
        isDefault: true,
    });

    logger.log('✅ Created traveller document');
    return traveller;
};

const createFlightBookings = async (user, traveller) => {
    const bookings = [
        {
            traceId: "test-trace-001",
            totalAmount: 100,
            fare: 90,
            taxes: 10,
            pnr: "TESTPNR001",
            gdsPnr: "GDS001",
            srdvBookingId: 100001,
            remark: "PayPal Test Booking #1",
        },
        {
            traceId: "test-trace-002",
            totalAmount: 250,
            fare: 220,
            taxes: 30,
            pnr: "TESTPNR002",
            gdsPnr: "GDS002",
            srdvBookingId: 100002,
            remark: "PayPal Test Booking #2",
        },
        {
            traceId: "test-trace-003",
            totalAmount: 500,
            fare: 450,
            taxes: 50,
            pnr: "TESTPNR003",
            gdsPnr: "GDS003",
            srdvBookingId: 100003,
            remark: "PayPal Test Booking #3",
        },
    ];

    const createdBookings = [];

    for (const booking of bookings) {
        let existing = await FlightBooking.findOne({
            user: user._id,
            traceId: booking.traceId,
        });

        if (existing) {
            logger.log(`ℹ️ Existing FlightBooking found: ${booking.traceId}`);
            createdBookings.push(existing);
            continue;
        }

        const flightBooking = await FlightBooking.create({
            user: user._id,

            traceId: booking.traceId,
            srdvType: "TEST",
            srdvIndex: "1",
            resultIndex: "1",
            isLCC: false,

            fareSnapshot: {
                fare: booking.fare,
                taxes: booking.taxes,
                totalFare: booking.totalAmount,
                currency: "USD",
            },

            totalAmount: booking.totalAmount,
            markupAmount: 0,

            isGstMandatory: false,
            gstDetails: {
                wantsInvoice: false,
            },

            pnr: booking.pnr,
            gdsPnr: booking.gdsPnr,
            srdvBookingId: booking.srdvBookingId,

            lastTicketDate: new Date(
                Date.now() + 5 * 24 * 60 * 60 * 1000
            ),

            status: "pending",
            ticketStatus: "pending",
            remark: booking.remark,

            passengers: [
                {
                    travellerId: traveller._id,
                    isLeadPax: true,
                },
            ],

            eTicketData: {
                notes: "PayPal USD Test Booking",
            },
        });

        logger.log(`✅ Created FlightBooking: ${flightBooking._id}`);

        createdBookings.push(flightBooking);
    }

    return createdBookings;
};

const createHotelBooking = async (user) => {
    const existing = await HotelBooking.findOne({
        userId: user._id,
        srdvHotelId: 'TEST_HOTEL_001',
    });

    if (existing) {
        logger.log('ℹ️  Existing HotelBooking found');
        return existing;
    }

    const hotelBooking = await HotelBooking.create({
        userId: user._id,
        srdvHotelId: 'TEST_HOTEL_001',
        hotelName: 'Test Hotel Mumbai',
        destination: 'Mumbai',
        checkIn: new Date('2024-12-25T14:00:00.000Z'),
        checkOut: new Date('2024-12-27T12:00:00.000Z'),
        roomType: 'Deluxe',
        pricePerNight: 15000,
        totalNights: 2,
        totalPrice: 30000,
        currency: 'INR',
        status: 'pending',
        srdvBookingRef: 'HOTELREF123',
        guestName: 'John Customer',
        guestEmail: 'customer@example.com',
        guestPhone: '8294507785',
        specialRequests: 'High floor, non-smoking',
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    });

    logger.log(`✅ Created HotelBooking: ${hotelBooking._id}`);
    return hotelBooking;
};

const createTour = async (user) => {
    const existing = await Tour.findOne({
        userId: user._id,
        title: 'Mumbai Highlights Package',
    });

    if (existing) {
        logger.log('ℹ️  Existing Tour found');
        return existing;
    }

    const tour = await Tour.create({
        userId: user._id,
        title: 'Mumbai Highlights Package',
        destination: 'Mumbai',
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-28'),
        duration: 3,
        budget: 25000,
        currency: 'INR',
        itinerary: [
            { day: 1, activity: 'Arrive in Mumbai', notes: 'Check-in and evening at Marine Drive' },
            { day: 2, activity: 'City tour', notes: 'Gateway of India and local market' },
            { day: 3, activity: 'Cultural day', notes: 'Elephanta Caves and departure' },
        ],
        accommodationType: 'Hotel',
        meals: 'Breakfast included',
        specialRequests: 'Vegetarian meals',
        transportationPreference: 'Private car',
        status: 'submitted',
        quotedPrice: 25000,
        quotedAt: new Date(),
        quotedExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.log(`✅ Created Tour: ${tour._id}`);
    return tour;
};

const main = async () => {
    try {
        await connectDB();

        const user = await findOrCreateTestUser();
        const traveller = await findOrCreateTraveller(user);

        const flightBookings = await createFlightBookings(user, traveller);
        const hotelBooking = await createHotelBooking(user);
        const tour = await createTour(user);

        logger.log("\n=== Created test booking records ===");

        flightBookings.forEach((booking, index) => {
            logger.log(`FlightBooking ${index + 1}: ${booking._id}`);
        });

        logger.log(`HotelBooking ID: ${hotelBooking._id}`);
        logger.log(`Tour ID: ${tour._id}`);

        logger.log("===================================");

        await mongoose.disconnect();
        logger.log("✅ MongoDB disconnected");
    } catch (error) {
        logger.error("❌ Error creating test bookings:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

main();

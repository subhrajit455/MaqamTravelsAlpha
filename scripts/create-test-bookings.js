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
const Package = require('../modules/packages/package.model');

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

const createHotelBookings = async (user) => {
    const hotels = [
        {
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
        },
        {
            srdvHotelId: 'TEST_HOTEL_002',
            hotelName: 'Oberoi Mumbai',
            destination: 'Mumbai',
            checkIn: new Date('2024-12-28T14:00:00.000Z'),
            checkOut: new Date('2024-12-30T12:00:00.000Z'),
            roomType: 'Executive Suite',
            pricePerNight: 22000,
            totalNights: 2,
            totalPrice: 44000,
            currency: 'INR',
            status: 'pending',
            srdvBookingRef: 'HOTELREF456',
            guestName: 'John Customer',
            guestEmail: 'customer@example.com',
            guestPhone: '8294507785',
            specialRequests: 'Ocean view room',
            cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
        },
    ];

    const createdBookings = [];

    for (const hotel of hotels) {
        let existing = await HotelBooking.findOne({
            userId: user._id,
            srdvHotelId: hotel.srdvHotelId,
        });

        if (existing) {
            logger.log(`ℹ️ Existing HotelBooking found: ${hotel.srdvHotelId}`);
            createdBookings.push(existing);
            continue;
        }

        const hotelBooking = await HotelBooking.create({
            userId: user._id,
            ...hotel,
        });

        logger.log(`✅ Created HotelBooking: ${hotelBooking._id}`);
        createdBookings.push(hotelBooking);
    }

    return createdBookings;
};

const createTours = async (user) => {
    const tours = [
        {
            title: 'Mumbai Highlights Package',
            destination: 'Mumbai',
            startDate: new Date('2024-12-25'),
            endDate: new Date('2024-12-28'),
            duration: 3,
            budget: 25000,
            currency: 'INR',
            itinerary: [
                { day: 1, activity: 'Arrive in Mumbai', notes: 'Check-in and evening at Marine Drive' },
                { day: 2, activity: 'City tour', notes: 'Gateway of India and local markets' },
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
        },
        {
            title: 'Goa Beach Getaway',
            destination: 'Goa',
            startDate: new Date('2024-12-27'),
            endDate: new Date('2024-12-31'),
            duration: 4,
            budget: 35000,
            currency: 'INR',
            itinerary: [
                { day: 1, activity: 'Arrive in Goa', notes: 'Check-in and beach sunset' },
                { day: 2, activity: 'Water sports', notes: 'Parasailing and jet skiing' },
                { day: 3, activity: 'Cultural tour', notes: 'Old Goa and Fort Aguada' },
                { day: 4, activity: 'Departure', notes: 'Beach morning and return flight' },
            ],
            accommodationType: 'Resort',
            meals: 'All meals included',
            specialRequests: 'Sea-facing room',
            transportationPreference: 'Shared transfer',
            status: 'submitted',
            quotedPrice: 35000,
            quotedAt: new Date(),
            quotedExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
    ];

    const createdTours = [];

    for (const tourData of tours) {
        let existing = await Tour.findOne({ userId: user._id, title: tourData.title });
        if (existing) {
            logger.log(`ℹ️ Existing Tour found: ${tourData.title}`);
            createdTours.push(existing);
            continue;
        }

        const tour = await Tour.create({
            userId: user._id,
            ...tourData,
        });

        logger.log(`✅ Created Tour: ${tour._id}`);
        createdTours.push(tour);
    }

    return createdTours;
};

const createPackages = async (user) => {
    const packages = [
        {
            name: 'Goa Family Escape',
            description: '4-night beach package with family-friendly stays, sightseeing, and leisure activities.',
            destination: 'Goa',
            duration: 4,
            startDate: new Date('2024-12-27'),
            endDate: new Date('2024-12-31'),
            price: 32000,
            currency: 'INR',
            discountPercentage: 10,
            itinerary: [
                { day: 1, activity: 'Arrival and beach walk', accommodation: 'Sea View Resort', meals: 'Dinner' },
                { day: 2, activity: 'Water sports and leisure', accommodation: 'Sea View Resort', meals: 'Breakfast, Lunch, Dinner' },
                { day: 3, activity: 'Cultural sightseeing', accommodation: 'Sea View Resort', meals: 'All meals' },
                { day: 4, activity: 'Departure', accommodation: 'Sea View Resort', meals: 'Breakfast' },
            ],
            inclusions: ['Accommodation', 'Breakfast', 'Airport transfers', 'Water sports session'],
            exclusions: ['Flights', 'Travel insurance', 'Personal expenses'],
            maxParticipants: 30,
            currentParticipants: 8,
            isActive: true,
            imageUrls: ['goa1.jpg', 'goa2.jpg'],
            createdBy: user._id,
        },
        {
            name: 'Rajasthan Heritage Trail',
            description: '7-day luxury tour covering Jaipur, Udaipur, and Jaisalmer with palace stays and guided tours.',
            destination: 'Rajasthan',
            duration: 7,
            startDate: new Date('2025-01-05'),
            endDate: new Date('2025-01-12'),
            price: 85000,
            currency: 'INR',
            discountPercentage: 12,
            itinerary: [
                { day: 1, activity: 'Jaipur city arrival', accommodation: 'Heritage Hotel', meals: 'Dinner' },
                { day: 2, activity: 'Amber Fort and City Palace', accommodation: 'Heritage Hotel', meals: 'All meals' },
                { day: 3, activity: 'Travel to Udaipur', accommodation: 'Lakefront Hotel', meals: 'All meals' },
                { day: 4, activity: 'City tour and boat ride', accommodation: 'Lakefront Hotel', meals: 'All meals' },
                { day: 5, activity: 'Journey to Jaisalmer', accommodation: 'Desert Camp', meals: 'All meals' },
                { day: 6, activity: 'Desert safari', accommodation: 'Desert Camp', meals: 'All meals' },
                { day: 7, activity: 'Departure', accommodation: 'Desert Camp', meals: 'Breakfast' },
            ],
            inclusions: ['Accommodation', 'Meals', 'Transfers', 'Sightseeing tours'],
            exclusions: ['Flights', 'Visa fees', 'Personal shopping'],
            maxParticipants: 20,
            currentParticipants: 5,
            isActive: true,
            imageUrls: ['rajasthan1.jpg', 'rajasthan2.jpg'],
            createdBy: user._id,
        },
    ];

    const createdPackages = [];

    for (const pkgData of packages) {
        let existing = await Package.findOne({ name: pkgData.name });
        if (existing) {
            logger.log(`ℹ️ Existing Package found: ${pkgData.name}`);
            createdPackages.push(existing);
            continue;
        }

        const pkg = await Package.create(pkgData);
        logger.log(`✅ Created Package: ${pkg._id}`);
        createdPackages.push(pkg);
    }

    return createdPackages;
};

const main = async () => {
    try {
        await connectDB();

        const user = await findOrCreateTestUser();
        const traveller = await findOrCreateTraveller(user);

        const flightBookings = await createFlightBookings(user, traveller);
        const hotelBookings = await createHotelBookings(user);
        const tours = await createTours(user);
        const packages = await createPackages(user);

        logger.log("\n=== Created test booking records ===");

        flightBookings.forEach((booking, index) => {
            logger.log(`FlightBooking ${index + 1}: ${booking._id}`);
        });
        hotelBookings.forEach((booking, index) => {
            logger.log(`HotelBooking ${index + 1}: ${booking._id}`);
        });
        tours.forEach((tour, index) => {
            logger.log(`Tour ${index + 1}: ${tour._id}`);
        });
        packages.forEach((pkg, index) => {
            logger.log(`Package ${index + 1}: ${pkg._id}`);
        });

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


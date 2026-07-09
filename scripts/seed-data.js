#!/usr/bin/env node

/**
 * Seed Test Data Script
 * Creates sample flights, hotels, tours, and test users in MongoDB
 * 
 * Run: npm run seed
 */
const dns = require('node:dns/promises');
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Flight = require('../modules/flights/flightInventory.model');
const Hotel = require('../modules/hotels/hotelInventory.model');
const Tour = require('../modules/tours/tour.model');
const User = require('../modules/auth/auth.model');

let customerUserId = null;
let agentUserId = null;

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI;

        console.log('🔍 Attempting to connect to MongoDB...');
        console.log('   URI (first 80 chars):', mongoUri.substring(0, 80) + '...');

        const connectOptions = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
        };

        await mongoose.connect(mongoUri, connectOptions);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check if MongoDB Atlas cluster is running');
        console.error('   2. Verify MONGO_URI in local.env is correct');
        console.error('   3. Check if your IP is whitelisted in MongoDB Atlas');
        console.error('   4. Ensure you have internet connectivity');
        console.error('   5. Try adding this IP to MongoDB Atlas Network Access\n');
        process.exit(1);
    }
};

const seedTestUsers = async () => {
    console.log('\n📝 Creating test users...');

    const testUsers = [
        {
            email: 'customer@example.com',
            phone: '8294507785',
            password: 'TestPass123!',
            firstName: 'John',
            lastName: 'Customer',
            role: 'customer',
        },
        {
            email: 'agent@example.com',
            phone: '8294507786',
            password: 'TestPass123!',
            firstName: 'Jane',
            lastName: 'Agent',
            role: 'sales_agent',
        },
    ];

    for (const userData of testUsers) {
        let existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            console.log(`  ⏭️  User ${userData.email} already exists`);
        } else {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            existingUser = new User({
                email: userData.email,
                phone: userData.phone,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                isVerified: true,
            });

            await existingUser.save();
            console.log(`  ✅ Created user: ${userData.email}`);
        }

        if (userData.email === 'customer@example.com') {
            customerUserId = existingUser._id;
        }
        if (userData.email === 'agent@example.com') {
            agentUserId = existingUser._id;
        }
    }

    if (!customerUserId) {
        const customer = await User.findOne({ email: 'customer@example.com' });
        customerUserId = customer?._id;
    }
    if (!agentUserId) {
        const agent = await User.findOne({ email: 'agent@example.com' });
        agentUserId = agent?._id;
    }

    if (!customerUserId || !agentUserId) {
        throw new Error('Unable to resolve seeded user IDs');
    }
};

const seedFlights = async () => {
    console.log('\n✈️  Creating test flights...');

    const testFlights = [
        {
            srdvFlightId: 'FL001_DEL_BOM_20241225',
            airline: 'Air India',
            flightNumber: 'AI-123',
            departure: {
                airport: 'DEL',
                city: 'Delhi',
                time: new Date('2024-12-25T08:00:00'),
            },
            arrival: {
                airport: 'BOM',
                city: 'Mumbai',
                time: new Date('2024-12-25T10:30:00'),
            },
            duration: 150,
            seatsAvailable: 120,
            price: 5000,
            currency: 'INR',
            bookingClass: 'economy',
            amenities: ['Meals', 'WiFi', 'USB Charging'],
        },
        {
            srdvFlightId: 'FL002_DEL_BOM_20241225',
            airline: 'IndiGo',
            flightNumber: 'IG-456',
            departure: {
                airport: 'DEL',
                city: 'Delhi',
                time: new Date('2024-12-25T14:00:00'),
            },
            arrival: {
                airport: 'BOM',
                city: 'Mumbai',
                time: new Date('2024-12-25T16:30:00'),
            },
            duration: 150,
            seatsAvailable: 180,
            price: 4500,
            currency: 'INR',
            bookingClass: 'economy',
            amenities: ['Meals', '6E Plus Seat'],
        },
        {
            srdvFlightId: 'FL003_BOM_BLR_20241226',
            airline: 'SpiceJet',
            flightNumber: 'SG-789',
            departure: {
                airport: 'BOM',
                city: 'Mumbai',
                time: new Date('2024-12-26T07:00:00'),
            },
            arrival: {
                airport: 'BLR',
                city: 'Bangalore',
                time: new Date('2024-12-26T09:15:00'),
            },
            duration: 135,
            seatsAvailable: 90,
            price: 3500,
            currency: 'INR',
            bookingClass: 'economy',
            amenities: ['Complimentary Beverage'],
        },
    ];

    for (const flightData of testFlights) {
        const existingFlight = await Flight.findOne({ srdvFlightId: flightData.srdvFlightId });
        if (existingFlight) {
            console.log(`  ⏭️  Flight ${flightData.flightNumber} already exists`);
            continue;
        }

        const flight = new Flight(flightData);
        await flight.save();
        console.log(`  ✅ Created flight: ${flightData.airline} ${flightData.flightNumber}`);
    }
};

const seedHotels = async () => {
    console.log('\n🏨 Creating test hotels...');

    const testHotels = [
        {
            srdvHotelId: 'HOTEL001_BOM',
            name: 'Taj Hotel Mumbai',
            city: 'Mumbai',
            area: 'Colaba',
            rating: 5,
            totalRooms: 50,
            availableRooms: 15,
            pricePerNight: 15000,
            currency: 'INR',
            amenities: ['WiFi', 'Pool', 'Gym', 'Spa', '24hr Room Service'],
            roomTypes: ['Deluxe', 'Suite', 'Presidential'],
            images: ['taj1.jpg', 'taj2.jpg'],
        },
        {
            srdvHotelId: 'HOTEL002_BOM',
            name: 'The Oberoi Mumbai',
            city: 'Mumbai',
            area: 'Nariman Point',
            rating: 5,
            totalRooms: 80,
            availableRooms: 25,
            pricePerNight: 18000,
            currency: 'INR',
            amenities: ['WiFi', 'Pool', 'Gym', 'Fine Dining', 'Concierge'],
            roomTypes: ['Deluxe', 'Club', 'Suite'],
            images: ['oberoi1.jpg', 'oberoi2.jpg'],
        },
        {
            srdvHotelId: 'HOTEL003_BLR',
            name: 'Radisson Blu Bangalore',
            city: 'Bangalore',
            area: 'Whitefield',
            rating: 4,
            totalRooms: 120,
            availableRooms: 40,
            pricePerNight: 8000,
            currency: 'INR',
            amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Business Center'],
            roomTypes: ['Standard', 'Deluxe', 'Suite'],
            images: ['radisson1.jpg', 'radisson2.jpg'],
        },
        {
            srdvHotelId: 'HOTEL004_DEL',
            name: 'The Leela Palace Delhi',
            city: 'Delhi',
            area: 'New Delhi',
            rating: 5,
            totalRooms: 100,
            availableRooms: 20,
            pricePerNight: 25000,
            currency: 'INR',
            amenities: ['WiFi', 'Pool', 'Spa', '5-Star Dining', 'Helipad'],
            roomTypes: ['Suite', 'Presidential', 'Royal'],
            images: ['leela1.jpg', 'leela2.jpg'],
        },
    ];

    for (const hotelData of testHotels) {
        const existingHotel = await Hotel.findOne({ srdvHotelId: hotelData.srdvHotelId });
        if (existingHotel) {
            console.log(`  ⏭️  Hotel ${hotelData.name} already exists`);
            continue;
        }

        const hotel = new Hotel(hotelData);
        await hotel.save();
        console.log(`  ✅ Created hotel: ${hotelData.name}`);
    }
};

const seedTours = async () => {
    console.log('\n🗺️  Creating test tours...');

    const testTours = [
        {
            userId: customerUserId,
            title: 'Mumbai Highlights Package',
            destination: 'Mumbai',
            duration: 3,
            startDate: new Date('2024-12-25'),
            endDate: new Date('2024-12-28'),
            maxParticipants: 20,
            currentParticipants: 5,
            price: 25000,
            currency: 'INR',
            itinerary: [
                {
                    day: 1,
                    title: 'Arrive in Mumbai',
                    activities: ['Check-in at hotel', 'Gateway of India', 'Marine Drive'],
                },
                {
                    day: 2,
                    title: 'City Tour',
                    activities: ['Haji Ali', 'Bandra-Worli Sea Link', 'Local Market'],
                },
                {
                    day: 3,
                    title: 'Beach & Culture',
                    activities: ['Elephanta Caves', 'Return flight'],
                },
            ],
            includes: ['Accommodation', 'Breakfast', 'Guided tours'],
            excludes: ['Flights', 'Personal expenses'],
            highlights: ['Gateway of India', 'Elephanta Caves', 'Marine Drive'],
        },
        {
            userId: customerUserId,
            title: 'Goa Beach Getaway',
            destination: 'Goa',
            duration: 4,
            startDate: new Date('2024-12-27'),
            endDate: new Date('2024-12-31'),
            maxParticipants: 30,
            currentParticipants: 12,
            price: 35000,
            currency: 'INR',
            itinerary: [
                {
                    day: 1,
                    title: 'Arrive in Goa',
                    activities: ['Check-in', 'Beach sunset', 'Dinner at beach shack'],
                },
                {
                    day: 2,
                    title: 'Water Sports',
                    activities: ['Para-sailing', 'Jet skiing', 'Beach volleyball'],
                },
                {
                    day: 3,
                    title: 'Cultural Tour',
                    activities: ['Fort Aguada', 'Old Goa churches', 'Spice market'],
                },
                {
                    day: 4,
                    title: 'Departure',
                    activities: ['Last-minute shopping', 'Flight back'],
                },
            ],
            includes: ['Accommodation', 'All meals', 'Water sports'],
            excludes: ['Flights', 'Travel insurance'],
            highlights: ['Water sports', 'Beach relaxation', 'Cultural sites'],
        },
    ];

    for (const tourData of testTours) {
        const existingTour = await Tour.findOne({ title: tourData.title });
        if (existingTour) {
            console.log(`  ⏭️  Tour ${tourData.title} already exists`);
            continue;
        }

        const tour = new Tour(tourData);
        await tour.save();
        console.log(`  ✅ Created tour: ${tourData.title}`);
    }
};

const main = async () => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║      🌍 Seeding Test Data               ║');
    console.log('╚════════════════════════════════════════════╝\n');

    try {
        await connectDB();

        await seedTestUsers();
        await seedFlights();
        await seedHotels();
        await seedTours();

        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║      ✅ Seeding Complete!                 ║');
        console.log('╚════════════════════════════════════════════╝\n');

        console.log('📋 Test User Credentials:');
        console.log('   Email: customer@example.com');
        console.log('   Password: TestPass123!');
        console.log('   Role: customer\n');
        console.log('   Email: agent@example.com');
        console.log('   Password: TestPass123!');
        console.log('   Role: sales_agent\n');

        console.log('✈️  Available test flights: 3');
        console.log('🏨 Available test hotels: 4');
        console.log('🗺️  Available test tours: 2\n');

        console.log('👉 Next steps:');
        console.log('   1. Start your server: npm start');
        console.log('   2. Login with test user credentials');
        console.log('   3. Search/book flights, hotels, tours\n');

        await mongoose.disconnect();
        console.log('✅ Connection closed\n');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

main();

#!/usr/bin/env node

/**
 * PayPal Configuration Verification Script
 * Run: node verify-paypal-config.js
 * 
 * This script checks if PayPal credentials are properly configured
 * without requiring flight/hotel data in the database
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 100,
    keepAliveMsecs: 10000,
});

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function verifyPayPalConfig() {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║          PayPal Configuration Verification Script                 ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    // ─── Step 1: Check Environment Variables ──────────────────────────────────
    console.log('📋 STEP 1: Checking Environment Variables\n');

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId) {
        log.error('PAYPAL_CLIENT_ID is not set in local.env');
        return false;
    }
    log.success(`PAYPAL_CLIENT_ID found (length: ${clientId.length})`);

    if (!clientSecret) {
        log.error('PAYPAL_CLIENT_SECRET is not set in local.env');
        return false;
    }
    log.success(`PAYPAL_CLIENT_SECRET found (length: ${clientSecret.length})`);

    log.success(`PAYPAL_MODE set to: ${mode}`);

    // ─── Step 2: Test API Connection ──────────────────────────────────────────
    console.log('\n📡 STEP 2: Testing PayPal API Connection\n');

    const baseUrl = mode === 'production'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com';

    log.info(`Connecting to: ${baseUrl}`);

    try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await axios.post(
            `${baseUrl}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${auth}`,
                },
                httpsAgent,
                timeout: 10000,
            }
        );

        if (response.data.access_token) {
            log.success('PayPal authentication successful! 🎉');
            log.info(`Token valid for: ${response.data.expires_in} seconds`);

            // ─── Step 3: Store token for later use ─────────────────────────────
            console.log('\n🔑 STEP 3: Token Information\n');
            log.success('Access token obtained successfully');
            const expiryDate = new Date(Date.now() + response.data.expires_in * 1000);
            log.info(`Expires at: ${expiryDate.toLocaleString()}`);

            // ─── Step 4: Test Order Creation ───────────────────────────────────
            console.log('\n📦 STEP 4: Testing Order Creation (Sandbox)\n');

            try {
                const orderResponse = await axios.post(
                    `${baseUrl}/v2/checkout/orders`,
                    {
                        intent: 'CAPTURE',
                        purchase_units: [{
                            amount: {
                                currency_code: 'USD',
                                value: '10.00',
                            },
                            description: 'Test Order - Maqam Travels',
                        }],
                        payment_source: {
                            paypal: {
                                experience_context: {
                                    return_url: 'http://localhost:3000/success',
                                    cancel_url: 'http://localhost:3000/cancel',
                                },
                            },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${response.data.access_token}`,
                            'Content-Type': 'application/json',
                        },
                        httpsAgent,
                        timeout: 10000,
                    }
                );

                if (orderResponse.data.id) {
                    log.success(`Test order created successfully!`);
                    log.info(`Order ID: ${orderResponse.data.id}`);
                    log.info(`Status: ${orderResponse.data.status}`);
                    log.info(`Approval URL: ${orderResponse.data.links?.find(l => l.rel === 'approve')?.href || 'Not available'}`);
                }
            } catch (orderError) {
                log.warning('Order creation test failed (but credentials are valid)');
                log.info(`Error: ${orderError.response?.data?.message || orderError.message}`);
            }

            return true;
        }
    } catch (error) {
        log.error('PayPal authentication failed!');

        if (error.response?.data) {
            log.error(`API Error: ${error.response.data.error_description || error.response.data.message}`);
            console.log('Response details:', JSON.stringify(error.response.data, null, 2));
        } else {
            log.error(`Connection Error: ${error.message}`);
        }

        return false;
    }
}

async function showDatabaseStatus() {
    console.log('\n📊 BONUS: Database Status Check\n');

    try {
        const mongoose = require('mongoose');

        // Try to connect without .env
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/travel-platform';

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        log.success(`MongoDB connected: ${mongoUri}`);

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('\nAvailable collections:');
        collections.forEach(col => {
            log.info(`  - ${col.name}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        log.warning(`MongoDB not available: ${error.message}`);
        log.info('Make sure MongoDB is running: mongod');
    }
}

async function main() {
    const success = await verifyPayPalConfig();

    if (success) {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║                     ✅ ALL CHECKS PASSED!                        ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        log.success('Your PayPal configuration is ready!');
        log.info('Next: Create test bookings and test payment flows\n');
    } else {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║                    ❌ CONFIGURATION ISSUES                       ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        log.error('Please fix the issues above and try again.');
        log.info('See TESTING_GUIDE.md for help\n');
    }

    // Show database status as bonus
    try {
        await showDatabaseStatus();
    } catch (e) {
        // Ignore
    }
}

main().catch(console.error);

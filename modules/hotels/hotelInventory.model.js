const mongoose = require('mongoose');

/**
 * ─── HOTEL INVENTORY MODEL ───────────────────────────
 * Stores hotel inventory data for test/demo scenarios.
 */

const hotelInventorySchema = new mongoose.Schema(
    {
        srdvHotelId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        area: {
            type: String,
            trim: true,
        },
        rating: Number,
        totalRooms: Number,
        availableRooms: Number,
        pricePerNight: Number,
        currency: {
            type: String,
            trim: true,
            default: 'INR',
        },
        amenities: [String],
        roomTypes: [String],
        images: [String],
    },
    {
        timestamps: true,
    }
);

hotelInventorySchema.index({ city: 1 });

module.exports = mongoose.model('Hotel', hotelInventorySchema);

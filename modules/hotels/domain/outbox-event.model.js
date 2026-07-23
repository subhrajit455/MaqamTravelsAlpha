'use strict';

const mongoose = require('mongoose');

const outboxEventSchema = new mongoose.Schema({
  aggregateType: { type: String, required: true, index: true }, // 'HotelBooking', etc.
  aggregateId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  eventType: { type: String, required: true, index: true }, // 'PAYMENT_RECEIVED', etc.
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'published', 'failed'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, index: true },
  error: String,
}, { timestamps: true });

outboxEventSchema.index({ status: 1, nextAttemptAt: 1 });

module.exports = mongoose.models.OutboxEvent || mongoose.model('OutboxEvent', outboxEventSchema);

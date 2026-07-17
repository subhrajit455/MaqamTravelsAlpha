// modules/packages/packageBooking.controller.js
const service = require("./packageBooking.service");

const createBooking = async (req, res) => {
  const { packageId, travellers, quantity } = req.body;
  const result = await service.createBooking({ userId: req.user.id, packageId, travellers, quantity });
  res.status(201).json({ success: true, ...result });
};

// ⚠️ TEMP endpoint — stands in for the real payment verify/webhook route. Delete once the
// payments developer's module is wired in here.
const mockConfirmPayment = async (req, res) => {
  const booking = await service.mockConfirmPayment(req.params.id, req.body.paymentId || "mock_payment_id");
  res.status(200).json({ success: true, booking });
};

const getBooking = async (req, res) => {
  const booking = await service.getBookingById(req.params.id, req.user.id);
  res.status(200).json({ success: true, booking });
};

const adminGetBooking = async (req, res) => {
  const booking = await service.getBookingByIdAdmin(req.params.id);
  res.status(200).json({ success: true, booking });
};

module.exports = { createBooking, mockConfirmPayment, getBooking, adminGetBooking };
// modules/packages/packageBooking.service.js
const Package = require("./package.model");
const PackageBooking = require("./packageBooking.model");
const stockClaim = require("./stockClaim.service");
const { calculateAvailability } = require("./package.service");
const { AppError } = require("../../middleware/errorHandler");
const logger = require("../../utils/logger");

// ⚠️ TEMP — stands in for the real payments developer's functions. Same call shape a real
// integration would need: (bookingId, amount) → { orderId, amount }. Swap this one function
// out later; nothing else here should need to change.
const mockCreatePaymentOrder = async (bookingId, amount) => ({
  orderId: `mock_order_${bookingId}_${Date.now()}`,
  amount,
});

// ⚠️ TEMP — mimics what a real payment-verified webhook will eventually call.
const mockConfirmPayment = async (bookingId, paymentId) => {
  const booking = await PackageBooking.findById(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.status !== "pending") {
    throw new AppError(`Cannot confirm payment — status is '${booking.status}', expected 'pending'`, 400);
  }

  await stockClaim.markUnitsUsed(booking.claimedFlightUnits, booking.claimedHotelUnits);

  booking.status = "confirmed";
  booking.razorpayPaymentId = paymentId;
  await booking.save();
  return booking;
};

const createBooking = async ({ userId, packageId, travellers, quantity }) => {
  if (!Array.isArray(travellers) || travellers.length === 0) {
    throw new AppError("At least one traveller is required", 400);
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError("quantity must be an integer >= 1", 400);
  }
  if (travellers.filter((t) => t.isLead).length !== 1) {
    throw new AppError("Exactly one traveller must be marked isLead", 400);
  }

  const pkg = await Package.findOne({ _id: packageId, isActive: true, isPublic: true })
    .populate("flightRefs.stock", "units")
    .populate("hotelRefs.stock", "units");

  if (!pkg) throw new AppError("Package not found", 404);

  const available = calculateAvailability(pkg);
  if (quantity > available) {
    throw new AppError(`Only ${available} slot(s) available for this package`, 409);
  }

  const packageSnapshot = {
    title: pkg.title,
    destination: pkg.destination,
    sellPrice: pkg.sellPrice,
    inclusions: pkg.inclusions,
    itinerary: pkg.itinerary,
    validity: pkg.validity,
  };

  const booking = await PackageBooking.create({
    userId, packageId, packageSnapshot, travellers, quantity,
    totalAmount: pkg.sellPrice * quantity,
    status: "initiated",
  });

  // Refs need plain stockIds for claiming — pkg.flightRefs[].stock is a populated
  // document at this point, not a bare ObjectId.
  const flightRefsForClaim = pkg.flightRefs.map((r) => ({ stock: r.stock._id, unitsPerBooking: r.unitsPerBooking }));
  const hotelRefsForClaim = pkg.hotelRefs.map((r) => ({ stock: r.stock._id, unitsPerBooking: r.unitsPerBooking }));

  try {
    const { claimedFlightUnits, claimedHotelUnits } = await stockClaim.claimUnitsForRefs({
      flightRefs: flightRefsForClaim,
      hotelRefs: hotelRefsForClaim,
      quantity,
      bookingId: booking._id,
      bookingModel: "PackageBooking",
    });
    booking.claimedFlightUnits = claimedFlightUnits;
    booking.claimedHotelUnits = claimedHotelUnits;
    booking.status = "pending";
    await booking.save();
  } catch (error) {
    // Should be rare given the availability check above — a genuine race, not bad data.
    booking.status = "cancelled";
    booking.remark = `Claim failed: ${error.message}`;
    await booking.save();
    logger.error(`Package booking claim failed: ${error.message}`);
    throw new AppError("Could not reserve stock for this booking — please try again", 409);
  }

  const { orderId, amount } = await mockCreatePaymentOrder(booking._id, booking.totalAmount);
  booking.razorpayOrderId = orderId;
  await booking.save();

  return { bookingId: booking._id, razorpayOrderId: orderId, amount };
};

const getBookingById = async (bookingId, userId) => {
  const booking = await PackageBooking.findOne({ _id: bookingId, userId });
  if (!booking) throw new AppError("Booking not found", 404);
  return booking;
};

const getBookingByIdAdmin = async (bookingId) => {
  const booking = await PackageBooking.findById(bookingId).populate("userId", "name phone email");
  if (!booking) throw new AppError("Booking not found", 404);
  return booking;
};

module.exports = { createBooking, mockConfirmPayment, getBookingById, getBookingByIdAdmin };
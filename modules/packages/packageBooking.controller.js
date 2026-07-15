const { createPackageBooking } = require("./packageBooking.service");

/**
 * POST /api/v1/packages/:id/book
 * Auth: customer
 */
async function bookPackage(req, res) {
  try {
    const booking = await createPackageBooking({
      userId: req.user.id,
      packageId: req.params.id,
      travellers: req.body.travellers,
      quantity: req.body.quantity || 1,
    });

    return res.status(201).json({
      success: true,
      message: "Package booking created. Proceed to payment.",
      data: booking,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { bookPackage };
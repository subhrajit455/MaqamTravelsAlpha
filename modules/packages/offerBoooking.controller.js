const { createOfferBooking } = require("./offerBooking.service");

/**
 * POST /api/v1/offers/:id/book
 * Auth: customer
 */
async function bookOffer(req, res) {
  try {
    const booking = await createOfferBooking({
      userId: req.user.id,
      offerId: req.params.id,
      travellers: req.body.travellers,
      quantity: req.body.quantity || 1,
    });

    return res.status(201).json({
      success: true,
      message: "Offer booking created. Proceed to payment.",
      data: booking,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { bookOffer };
const express = require("express");
const router = express.Router();
 
const { authenticate } = require("../../middlewares/auth.middleware");
const { bookOffer } = require("../controllers/offerBooking.controller");
// const { listOffers, getOffer } = require("../controllers/offer.controller"); // browse endpoints — not built yet
 
// Public — browsing offers needs no login
// router.get("/", listOffers);
// router.get("/:id", getOffer);
 
// Auth required — booking
router.post("/:id/book", authenticate, bookOffer);
 
module.exports = router;
 
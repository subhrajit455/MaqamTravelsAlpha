const router = require('express').Router();
const tourController = require('./tour.controller');
const tourValidator = require('./tour.validator');
const validate = require('../../middleware/validate');

/**
 * ─── TOUR ROUTES ──────────────────────────────────────
 * Pattern: Custom tour planner (draft → submit → review → quote → book)
 * Requires auth middleware
 */

// TODO: Add auth middleware

// Get all user's tours
router.get('/', tourController.getMyTours);

// Get tour details
router.get('/:tourId', tourValidator.validateTourId(), validate, tourController.getTourDetails);

// Create new tour (draft)
router.post('/', tourValidator.validateCreateTour(), validate, tourController.createTour);

// Update tour
router.put('/:tourId', tourValidator.validateUpdateTour(), validate, tourController.updateTour);

// Submit tour for quote
router.post('/:tourId/submit', tourValidator.validateTourId(), validate, tourController.submitTour);

// Cancel tour
router.post('/:tourId/cancel', tourValidator.validateTourId(), validate, tourController.cancelTour);

module.exports = router;

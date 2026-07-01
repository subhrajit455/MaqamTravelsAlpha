const router = require('express').Router();
const packageController = require('./package.controller');
const packageValidator = require('./package.validator');
const validate = require('../../middleware/validate');

/**
 * ─── PACKAGE ROUTES ───────────────────────────────────
 * Pattern: Browse packages, get details, create bookings
 * Public browsing, auth required for bookings
 */

// Get all packages
router.get('/', packageValidator.validateList(), validate, packageController.listPackages);

// Get package details
router.get('/:packageId', packageValidator.validatePackageId(), validate, packageController.getPackageDetails);

// Search packages
router.post('/search', packageValidator.validateSearch(), validate, packageController.searchPackages);

// TODO: Create booking — requires auth

module.exports = router;

const router = require('express').Router();
const travellerController = require('./traveller.controller.js');
const travellerValidator = require('./traveller.validator');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authMiddleware.authenticate);

router.get('/', travellerController.getTravellersByUserId);
router.get('/:travellerId', travellerValidator.validateTravellerId(), validate, travellerController.getTravellerById);
router.post('/', travellerValidator.validateCreateTraveller(), validate, travellerController.createTraveller);
router.put('/:travellerId', travellerValidator.validateTravellerId(), travellerValidator.validateUpdateTraveller(), validate, travellerController.updateTraveller);
router.delete('/:travellerId', travellerValidator.validateTravellerId(), validate, travellerController.deleteTraveller);

module.exports = router;
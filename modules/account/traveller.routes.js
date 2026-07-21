const router = require('express').Router();
const travellerController = require('./traveller.controller.js');
const travellerValidator = require('./traveller.validator');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
router.use(authMiddleware.authenticate);

router.get('/getAll', authenticate, travellerController.getTravellersByUserId);
router.get('/:travellerId', travellerValidator.validateTravellerId(), validate, authenticate, travellerController.getTravellerById);
router.post('/create', travellerValidator.validateCreateTraveller(), validate, authenticate, travellerController.createTraveller);
router.put('/:travellerId', travellerValidator.validateTravellerId(), travellerValidator.validateUpdateTraveller(), validate, authenticate, travellerController.updateTraveller);
router.delete('/:travellerId', travellerValidator.validateTravellerId(), validate, authenticate, travellerController.deleteTraveller);

module.exports = router;

const tourService = require('./tour.service');
const { sendSuccess, sendCreated, sendNotFound } = require('../../utils/apiResponse');

/**
 * ─── TOUR CONTROLLER ───────────────────────────────────
 * Thin layer: calls service, sends response
 */

const getMyTours = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { status, page, limit } = req.query;
    
    const result = await tourService.getUserTours(userId, { status, page, limit });
    
    return sendSuccess(res, {
      message: 'Tours retrieved',
      data: result.tours,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getTourDetails = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    
    const tour = await tourService.getTourById(tourId);
    if (!tour) {
      return sendNotFound(res, 'Tour not found');
    }
    
    return sendSuccess(res, { message: 'Tour details', data: tour });
  } catch (error) {
    next(error);
  }
};

const createTour = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const tourData = req.body;
    
    const tour = await tourService.createTour(userId, tourData);
    
    return sendCreated(res, tour, 'Tour created successfully');
  } catch (error) {
    next(error);
  }
};

const updateTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const updates = req.body;
    
    const tour = await tourService.updateTour(tourId, updates);
    if (!tour) {
      return sendNotFound(res, 'Tour not found');
    }
    
    return sendSuccess(res, { message: 'Tour updated', data: tour });
  } catch (error) {
    next(error);
  }
};

const submitTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    
    const tour = await tourService.submitTour(tourId);
    if (!tour) {
      return sendNotFound(res, 'Tour not found');
    }
    
    return sendSuccess(res, { message: 'Tour submitted for quote', data: tour });
  } catch (error) {
    next(error);
  }
};

const cancelTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    
    const tour = await tourService.cancelTour(tourId);
    if (!tour) {
      return sendNotFound(res, 'Tour not found');
    }
    
    return sendSuccess(res, { message: 'Tour cancelled', data: tour });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyTours,
  getTourDetails,
  createTour,
  updateTour,
  submitTour,
  cancelTour,
};

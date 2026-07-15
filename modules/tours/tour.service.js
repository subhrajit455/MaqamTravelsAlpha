const Tour = require('./tour.model');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { TOUR_STATUS } = require('../../config/constants');

/**
 * ─── TOUR SERVICE ──────────────────────────────────────
 * Business logic: manage custom tour requests
 */

const getUserTours = async (userId, { status, page = 1, limit = 10 } = {}) => {
  try {
    const query = { userId };
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    const tours = await Tour.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Tour.countDocuments(query);
    
    return {
      tours,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Get user tours failed: ${error.message}`);
    throw error;
  }
};

const getTourById = async (tourId) => {
  try {
    return await Tour.findById(tourId).populate('userId', 'email firstName lastName');
  } catch (error) {
    logger.error(`Get tour failed: ${error.message}`);
    throw error;
  }
};

const createTour = async (userId, tourData) => {
  try {
    const tour = await Tour.create({
      userId,
      ...tourData,
      status: TOUR_STATUS.DRAFT,
    });
    
    logger.info(`Tour created: ${tour._id}`);
    return tour;
  } catch (error) {
    logger.error(`Create tour failed: ${error.message}`);
    throw error;
  }
};

const updateTour = async (tourId, updates) => {
  try {
    // Can only update if in DRAFT status
    const tour = await Tour.findById(tourId);
    if (tour.status !== TOUR_STATUS.DRAFT) {
      throw new AppError('Can only update tours in draft status', 400);
    }
    
    const updated = await Tour.findByIdAndUpdate(tourId, updates, { new: true });
    logger.info(`Tour updated: ${tourId}`);
    return updated;
  } catch (error) {
    logger.error(`Update tour failed: ${error.message}`);
    throw error;
  }
};

const submitTour = async (tourId) => {
  try {
    const tour = await Tour.findById(tourId);
    if (tour.status !== TOUR_STATUS.DRAFT) {
      throw new AppError('Only draft tours can be submitted', 400);
    }
    
    const updated = await Tour.findByIdAndUpdate(
      tourId,
      { status: TOUR_STATUS.SUBMITTED, submittedAt: new Date() },
      { new: true }
    );
    
    logger.info(`Tour submitted: ${tourId}`);
    // TODO: Notify agents
    return updated;
  } catch (error) {
    logger.error(`Submit tour failed: ${error.message}`);
    throw error;
  }
};

const cancelTour = async (tourId) => {
  try {
    const updated = await Tour.findByIdAndUpdate(
      tourId,
      { status: TOUR_STATUS.CANCELLED, cancelledAt: new Date() },
      { new: true }
    );
    
    logger.info(`Tour cancelled: ${tourId}`);
    return updated;
  } catch (error) {
    logger.error(`Cancel tour failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getUserTours,
  getTourById,
  createTour,
  updateTour,
  submitTour,
  cancelTour,
};

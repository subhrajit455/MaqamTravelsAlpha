const Package = require('./package.model');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

/**
 * ─── PACKAGE SERVICE ───────────────────────────────────
 * Business logic: manage pre-built tour packages
 */

const listPackages = async ({ page = 1, limit = 10 } = {}) => {
  try {
    const skip = (page - 1) * limit;
    const packages = await Package.find({ isActive: true })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Package.countDocuments({ isActive: true });
    
    return {
      packages,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`List packages failed: ${error.message}`);
    throw error;
  }
};

const getPackageById = async (packageId) => {
  try {
    return await Package.findOne({ _id: packageId, isActive: true });
  } catch (error) {
    logger.error(`Get package failed: ${error.message}`);
    throw error;
  }
};

const searchPackages = async ({ destination, priceMin, priceMax, duration, page = 1, limit = 10 }) => {
  try {
    const query = { isActive: true };
    
    if (destination) query.destination = { $regex: destination, $options: 'i' };
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = priceMin;
      if (priceMax) query.price.$lte = priceMax;
    }
    if (duration) query.duration = duration;
    
    const skip = (page - 1) * limit;
    const packages = await Package.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Package.countDocuments(query);
    
    logger.info(`Searched packages: found ${total}`);
    
    return {
      packages,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Search packages failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  listPackages,
  getPackageById,
  searchPackages,
};

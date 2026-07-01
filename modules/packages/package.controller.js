const packageService = require('./package.service');
const { sendSuccess, sendNotFound } = require('../../utils/apiResponse');

/**
 * ─── PACKAGE CONTROLLER ────────────────────────────────
 * Thin layer: calls service, sends response
 */

const listPackages = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await packageService.listPackages({
      page: page || 1,
      limit: limit || 10,
    });
    
    return sendSuccess(res, {
      message: 'Packages retrieved',
      data: result.packages,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getPackageDetails = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    
    const pkg = await packageService.getPackageById(packageId);
    if (!pkg) {
      return sendNotFound(res, 'Package not found');
    }
    
    return sendSuccess(res, { message: 'Package details', data: pkg });
  } catch (error) {
    next(error);
  }
};

const searchPackages = async (req, res, next) => {
  try {
    const { destination, priceMin, priceMax, duration, page, limit } = req.body;
    
    const result = await packageService.searchPackages({
      destination,
      priceMin,
      priceMax,
      duration,
      page: page || 1,
      limit: limit || 10,
    });
    
    return sendSuccess(res, {
      message: 'Packages found',
      data: result.packages,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPackages,
  getPackageDetails,
  searchPackages,
};

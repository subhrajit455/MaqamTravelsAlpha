// modules/packages/package.service.js
const Package = require("./package.model");
const TicketStock = require("./ticketStock.model");
const HotelStock = require("./hotelStock.model"); // assuming same shape as TicketStock —
// availableUnits virtual + costPerUnit —
// confirm once you paste it
const logger = require("../../utils/logger");
const { AppError } = require("../../middleware/errorHandler");

/**
 * ─── AVAILABILITY + COST CALC ──────────────────────────
 * Both assume flightRefs.stock / hotelRefs.stock are already populated by the caller.
 */

const calculateAvailability = (pkg) => {
  const counts = [
    ...pkg.flightRefs.map((ref) =>
      Math.floor(ref.stock.availableUnits / ref.unitsPerBooking),
    ),
    ...pkg.hotelRefs.map((ref) =>
      Math.floor(ref.stock.availableUnits / ref.unitsPerBooking),
    ),
  ];
  // No stock refs at all → can't be sold. 0, not "unlimited".
  if (counts.length === 0) return 0;
  return Math.min(...counts);
};

const calculateCostPrice = (pkg) => {
  const flightCost = pkg.flightRefs.reduce(
    (sum, ref) => sum + ref.stock.costPerUnit * ref.unitsPerBooking,
    0,
  );
  const hotelCost = pkg.hotelRefs.reduce(
    (sum, ref) => sum + ref.stock.costPerUnit * ref.unitsPerBooking,
    0,
  );
  const otherCost = pkg.otherItems.reduce((sum, item) => sum + item.cost, 0);
  return flightCost + hotelCost + otherCost;
};

/**
 * ─── CUSTOMER-FACING READS ──────────────────────────────
 * Only ever populate `units` off the referenced stock — enough to compute availableUnits,
 * without costPerUnit/pnr/nameAdditionDeadline ever entering memory on these routes at all.
 */
const CUSTOMER_STOCK_PROJECTION = "units";

const toCustomerShape = (pkg) => ({
  _id: pkg._id,
  title: pkg.title,
  description: pkg.description,
  destination: pkg.destination,
  images: pkg.images,
  sellPrice: pkg.sellPrice,
  inclusions: pkg.inclusions,
  itinerary: pkg.itinerary,
  validity: pkg.validity,
  availableSlots: calculateAvailability(pkg),
});

const listPackages = async ({ page = 1, limit = 10 } = {}) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const packages = await Package.find({ isActive: true, isPublic: true })
      .populate("flightRefs.stock", CUSTOMER_STOCK_PROJECTION)
      .populate("hotelRefs.stock", CUSTOMER_STOCK_PROJECTION)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Package.countDocuments({
      isActive: true,
      isPublic: true,
    });

    return {
      packages: packages.map(toCustomerShape),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error(`List packages failed: ${error.message}`);
    throw error;
  }
};

const getPackageById = async (packageId) => {
  try {
    const pkg = await Package.findOne({
      _id: packageId,
      isActive: true,
      isPublic: true,
    })
      .populate("flightRefs.stock", CUSTOMER_STOCK_PROJECTION)
      .populate("hotelRefs.stock", CUSTOMER_STOCK_PROJECTION);

    if (!pkg) throw new AppError("Package not found", 404);
    return toCustomerShape(pkg);
  } catch (error) {
    logger.error(`Get package failed: ${error.message}`);
    throw error;
  }
};

const searchPackages = async ({
  destination,
  sellPriceMin,
  sellPriceMax,
  page = 1,
  limit = 10,
}) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const query = { isActive: true, isPublic: true };

    if (destination) query.destination = { $regex: destination, $options: "i" };
    if (sellPriceMin || sellPriceMax) {
      query.sellPrice = {};
      if (sellPriceMin) query.sellPrice.$gte = Number(sellPriceMin);
      if (sellPriceMax) query.sellPrice.$lte = Number(sellPriceMax);
    }

    const skip = (page - 1) * limit;
    const packages = await Package.find(query)
      .populate("flightRefs.stock", CUSTOMER_STOCK_PROJECTION)
      .populate("hotelRefs.stock", CUSTOMER_STOCK_PROJECTION)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Package.countDocuments(query);

    return {
      packages: packages.map(toCustomerShape),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error(`Search packages failed: ${error.message}`);
    throw error;
  }
};

/**
 * ─── ADMIN READS ─────────────────────────────────────────
 * Full stock populate — costPerUnit/pnr/nameAdditionDeadline are fair game, this never
 * serves a customer-facing route.
 */

const toAdminShape = (pkg) => ({
  ...pkg.toObject(),
  availableSlots: calculateAvailability(pkg),
  costPrice: calculateCostPrice(pkg),
});

const getPackageByIdAdmin = async (packageId) => {
  try {
    const pkg = await Package.findById(packageId)
      .populate("flightRefs.stock")
      .populate("hotelRefs.stock");
    if (!pkg) throw new AppError("Package not found", 404);
    return toAdminShape(pkg);
  } catch (error) {
    logger.error(`Get package (admin) failed: ${error.message}`);
    throw error;
  }
};

const listPackagesAdmin = async ({ page = 1, limit = 10 } = {}) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const packages = await Package.find({})
      .populate("flightRefs.stock")
      .populate("hotelRefs.stock")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Package.countDocuments({});

    return {
      packages: packages.map(toAdminShape),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error(`List packages (admin) failed: ${error.message}`);
    throw error;
  }
};

/**
 * ─── ADMIN WRITES ─────────────────────────────────────────
 */

const createPackage = async (data, adminUserId) => {
  try {
    return await Package.create({ ...data, createdBy: adminUserId });
  } catch (error) {
    logger.error(`Create package failed: ${error.message}`);
    throw error;
  }
};

const updatePackage = async (packageId, data) => {
  try {
    const pkg = await Package.findByIdAndUpdate(packageId, data, {
      new: true,
      runValidators: true,
    });
    if (!pkg) throw new AppError("Package not found", 404);
    return pkg;
  } catch (error) {
    logger.error(`Update package failed: ${error.message}`);
    throw error;
  }
};

// Soft delete — a hard delete would orphan any PackageBooking.packageId still pointing at it.
const deactivatePackage = async (packageId) => {
  try {
    const pkg = await Package.findByIdAndUpdate(
      packageId,
      { isActive: false },
      { new: true },
    );
    if (!pkg) throw new AppError("Package not found", 404);
    return pkg;
  } catch (error) {
    logger.error(`Deactivate package failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  calculateAvailability,
  calculateCostPrice,
  listPackages,
  getPackageById,
  searchPackages,
  getPackageByIdAdmin,
  listPackagesAdmin,
  createPackage,
  updatePackage,
  deactivatePackage,
};

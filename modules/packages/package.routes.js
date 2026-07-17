// modules/packages/package.routes.js
//
// Two routers from one file — mount both wherever app.js mounts other modules:
//   app.use("/api/v1/packages", packageRoutes.customer);
//   app.use("/api/v1/crm/packages", packageRoutes.admin);   // under your existing CRM prefix

const express = require("express");
const packageController = require("./package.controller");
const bookingController = require("./packageBooking.controller");
const { authenticate, authorize } = require("../../middleware/auth"); 

const customerRouter = express.Router();
customerRouter.get("/", packageController.getPackages);
customerRouter.get("/:id", packageController.getPackageDetail);

customerRouter.post("/book", authenticate, bookingController.createBooking);
// ⚠️ TEMP — mimics what a real payment-verified webhook will eventually call.
customerRouter.post("/:id/mock-pay", authenticate, bookingController.mockConfirmPayment); // ⚠️ TEMP
customerRouter.get("/bookings/:id", authenticate, bookingController.getBooking);

const adminRouter = express.Router();
adminRouter.use(authenticate); // auth only here — role checks are per-route below

adminRouter.get("/", authorize("admin", "super_admin"), packageController.adminListPackages);
adminRouter.get("/:id", authorize("admin", "super_admin"), packageController.adminGetPackage);
adminRouter.post("/", authorize("admin", "super_admin"), packageController.adminCreatePackage);
adminRouter.patch("/:id", authorize("admin", "super_admin"), packageController.adminUpdatePackage);
adminRouter.patch("/:id/deactivate", authorize("admin", "super_admin"), packageController.adminDeactivatePackage);

// finance is read-only on bookings — separate role set from the package-management routes above
adminRouter.get("/bookings/:id", authorize("admin", "super_admin", "finance"), bookingController.adminGetBooking);

module.exports = { customer: customerRouter, admin: adminRouter };
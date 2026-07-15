// modules/packages/package.routes.js
//
// Two routers from one file — mount both wherever app.js mounts other modules:
//   app.use("/api/v1/packages", packageRoutes.customer);
//   app.use("/api/v1/crm/packages", packageRoutes.admin);   // under your existing CRM prefix

const express = require("express");
const controller = require("./package.controller");
const { authenticate,authorize } = require("../../middleware/auth");

const customerRouter = express.Router();
customerRouter.get("/", controller.getPackages);
customerRouter.get("/:id", controller.getPackageDetail);

const adminRouter = express.Router();
adminRouter.use(authenticate, authorize("admin", "super_admin"));
adminRouter.get("/", controller.adminListPackages);
adminRouter.get("/:id", controller.adminGetPackage);
adminRouter.post("/", controller.adminCreatePackage);
adminRouter.patch("/:id", controller.adminUpdatePackage);
adminRouter.patch("/:id/deactivate", controller.adminDeactivatePackage);

module.exports = { customer: customerRouter, admin: adminRouter };
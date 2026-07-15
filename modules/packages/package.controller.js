// modules/packages/package.controller.js
//
// Thin — validate, call service, respond. No try/catch: express-async-errors forwards any
// thrown error to the error middleware.

const packageService = require("./package.service");
const { validateCreatePackage, validateUpdatePackage } = require("./package.validator");

/** ─── CUSTOMER-FACING ───────────────────────────────── */

// GET /api/v1/packages — handles both "browse all" and "filtered search" via the same
// endpoint; filters are just optional query params. One customer listing function, not two.
const getPackages = async (req, res) => {
  const result = await packageService.searchPackages(req.query);
  res.status(200).json({ success: true, ...result });
};

const getPackageDetail = async (req, res) => {
  const pkg = await packageService.getPackageById(req.params.id);
  res.status(200).json({ success: true, package: pkg });
};

/** ─── ADMIN (CRM) ───────────────────────────────────── */

const adminListPackages = async (req, res) => {
  const result = await packageService.listPackagesAdmin(req.query);
  res.status(200).json({ success: true, ...result });
};

const adminGetPackage = async (req, res) => {
  const pkg = await packageService.getPackageByIdAdmin(req.params.id);
  res.status(200).json({ success: true, package: pkg });
};

const adminCreatePackage = async (req, res) => {
  validateCreatePackage(req.body);
  const pkg = await packageService.createPackage(req.body, req.user.id);
  res.status(201).json({ success: true, package: pkg });
};

const adminUpdatePackage = async (req, res) => {
  validateUpdatePackage(req.body);
  const pkg = await packageService.updatePackage(req.params.id, req.body);
  res.status(200).json({ success: true, package: pkg });
};

// Soft delete only — deleteOne comes later, per your earlier decision.
const adminDeactivatePackage = async (req, res) => {
  const pkg = await packageService.deactivatePackage(req.params.id);
  res.status(200).json({ success: true, package: pkg });
};

module.exports = {
  getPackages, getPackageDetail,
  adminListPackages, adminGetPackage, adminCreatePackage, adminUpdatePackage, adminDeactivatePackage,
};

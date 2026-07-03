const { body, param } = require("express-validator");

/**
 * ─── CMS VALIDATORS ───────────────────────────────────
 * Validators for CMS endpoints
 */

const validatePageSlug = () => [
  param("slug").trim().notEmpty().withMessage("Page slug is required"),
];

const validateCreatePage = () => [
  body("type").isIn(["page", "faq", "blog"]).withMessage("Invalid page type"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("slug").trim().notEmpty().withMessage("Slug is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
];

const validateUpdatePage = () => [
  param("pageId").isMongoId().withMessage("Invalid page ID"),
];

module.exports = {
  validatePageSlug,
  validateCreatePage,
  validateUpdatePage,
};

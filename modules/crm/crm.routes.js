const router = require("express").Router();
const crmController = require("./crm.controller");
const crmValidator = require("./crm.validator");
const validate = require("../../middleware/validate");

/**
 * ─── CRM ROUTES ────────────────────────────────────────
 * Pattern: Lead/customer management for sales agents & admins
 * Prefix-gated: Only accessible via CRM_PREFIX (e.g., /ops-crm)
 * Requires admin/agent role
 */

// TODO: Add RBAC middleware to check admin/agent role

// Get all leads
router.get(
  "/leads",
  crmValidator.validateListLeads(),
  validate,
  crmController.listLeads,
);

// Get lead details
router.get(
  "/leads/:leadId",
  crmValidator.validateLeadId(),
  validate,
  crmController.getLeadDetails,
);

// Create lead
router.post(
  "/leads",
  crmValidator.validateCreateLead(),
  validate,
  crmController.createLead,
);

// Update lead
router.put(
  "/leads/:leadId",
  crmValidator.validateUpdateLead(),
  validate,
  crmController.updateLead,
);

// Convert lead to booking
router.post(
  "/leads/:leadId/convert",
  crmValidator.validateLeadId(),
  validate,
  crmController.convertLead,
);

// Get agent statistics
router.get("/stats", crmController.getAgentStats);

// Get pipeline overview
router.get("/pipeline", crmController.getPipelineOverview);

module.exports = router;

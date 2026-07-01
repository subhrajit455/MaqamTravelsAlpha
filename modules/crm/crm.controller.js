const crmService = require('./crm.service');
const { sendSuccess, sendCreated, sendNotFound } = require('../../utils/apiResponse');

/**
 * ─── CRM CONTROLLER ────────────────────────────────────
 * Thin layer: calls service, sends response
 */

const listLeads = async (req, res, next) => {
  try {
    const { status, assignedTo, page, limit } = req.query;
    const agentId = req.user?.id; // from RBAC middleware
    
    const result = await crmService.listLeads({
      status,
      assignedTo: assignedTo || agentId,
      page: page || 1,
      limit: limit || 20,
    });
    
    return sendSuccess(res, {
      message: 'Leads retrieved',
      data: result.leads,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getLeadDetails = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    
    const lead = await crmService.getLeadById(leadId);
    if (!lead) {
      return sendNotFound(res, 'Lead not found');
    }
    
    return sendSuccess(res, { message: 'Lead details', data: lead });
  } catch (error) {
    next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const agentId = req.user?.id;
    const leadData = req.body;
    
    const lead = await crmService.createLead(agentId, leadData);
    
    return sendCreated(res, lead, 'Lead created successfully');
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const updates = req.body;
    
    const lead = await crmService.updateLead(leadId, updates);
    if (!lead) {
      return sendNotFound(res, 'Lead not found');
    }
    
    return sendSuccess(res, { message: 'Lead updated', data: lead });
  } catch (error) {
    next(error);
  }
};

const convertLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { bookingData } = req.body;
    
    const result = await crmService.convertLeadToBooking(leadId, bookingData);
    if (!result) {
      return sendNotFound(res, 'Lead not found');
    }
    
    return sendSuccess(res, { message: 'Lead converted to booking', data: result });
  } catch (error) {
    next(error);
  }
};

const getAgentStats = async (req, res, next) => {
  try {
    const agentId = req.user?.id;
    
    const stats = await crmService.getAgentStatistics(agentId);
    
    return sendSuccess(res, { message: 'Agent statistics', data: stats });
  } catch (error) {
    next(error);
  }
};

const getPipelineOverview = async (req, res, next) => {
  try {
    const overview = await crmService.getPipelineOverview();
    
    return sendSuccess(res, { message: 'Pipeline overview', data: overview });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLeads,
  getLeadDetails,
  createLead,
  updateLead,
  convertLead,
  getAgentStats,
  getPipelineOverview,
};

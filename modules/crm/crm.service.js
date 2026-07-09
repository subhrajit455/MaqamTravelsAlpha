const Lead = require("./crm.model");
const logger = require("../../utils/logger");
const { LEAD_STATUS } = require("../../config/constants");

/**
 * ─── CRM SERVICE ───────────────────────────────────────
 * Business logic: manage sales leads and conversions
 */

const listLeads = async ({ status, assignedTo, page = 1, limit = 20 } = {}) => {
  try {
    const query = {};
    if (status) query.status = status;
    if (assignedTo) query.assignedAgent = assignedTo;

    const skip = (page - 1) * limit;
    const leads = await Lead.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("assignedAgent", "firstName lastName email")
      .sort({ createdAt: -1 });

    const total = await Lead.countDocuments(query);

    return {
      leads,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`List leads failed: ${error.message}`);
    throw error;
  }
};

const getLeadById = async (leadId) => {
  try {
    return await Lead.findById(leadId)
      .populate("assignedAgent", "firstName lastName email")
      .populate("convertedBooking");
  } catch (error) {
    logger.error(`Get lead failed: ${error.message}`);
    throw error;
  }
};

const createLead = async (agentId, leadData) => {
  try {
    const lead = await Lead.create({
      ...leadData,
      assignedAgent: agentId,
      status: LEAD_STATUS.NEW,
    });

    logger.info(`Lead created: ${lead._id}`);
    return lead;
  } catch (error) {
    logger.error(`Create lead failed: ${error.message}`);
    throw error;
  }
};

const updateLead = async (leadId, updates) => {
  try {
    const lead = await Lead.findByIdAndUpdate(leadId, updates, { new: true });

    if (lead) logger.info(`Lead updated: ${leadId}`);
    return lead;
  } catch (error) {
    logger.error(`Update lead failed: ${error.message}`);
    throw error;
  }
};

const convertLeadToBooking = async (leadId, bookingData) => {
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) return null;

    // TODO: Create booking from lead data
    // const booking = await Booking.create({ ...bookingData });

    // Update lead status
    lead.status = LEAD_STATUS.CONVERTED;
    lead.convertedBooking = null; // bookingId
    lead.convertedAt = new Date();
    await lead.save();

    logger.info(`Lead converted to booking: ${leadId}`);
    return lead;
  } catch (error) {
    logger.error(`Convert lead failed: ${error.message}`);
    throw error;
  }
};

const getAgentStatistics = async (agentId) => {
  try {
    const leads = await Lead.find({ assignedAgent: agentId });

    const stats = {
      totalLeads: leads.length,
      new: leads.filter((l) => l.status === LEAD_STATUS.NEW).length,
      contacted: leads.filter((l) => l.status === LEAD_STATUS.CONTACTED).length,
      interested: leads.filter((l) => l.status === LEAD_STATUS.INTERESTED)
        .length,
      quoted: leads.filter((l) => l.status === LEAD_STATUS.QUOTED).length,
      converted: leads.filter((l) => l.status === LEAD_STATUS.CONVERTED).length,
      lost: leads.filter((l) => l.status === LEAD_STATUS.LOST).length,
    };

    return stats;
  } catch (error) {
    logger.error(`Get agent stats failed: ${error.message}`);
    throw error;
  }
};

const getPipelineOverview = async () => {
  try {
    const leads = await Lead.find();

    const overview = {
      totalLeads: leads.length,
      byStatus: {},
    };

    Object.values(LEAD_STATUS).forEach((status) => {
      overview.byStatus[status] = leads.filter(
        (l) => l.status === status,
      ).length;
    });

    return overview;
  } catch (error) {
    logger.error(`Get pipeline overview failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLeadToBooking,
  getAgentStatistics,
  getPipelineOverview,
};

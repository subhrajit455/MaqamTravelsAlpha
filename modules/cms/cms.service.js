const CMSPage = require('./cms.model');
const logger = require('../../utils/logger');

/**
 * ─── CMS SERVICE ───────────────────────────────────────
 * Business logic: manage static content
 */

const getPageBySlug = async (slug) => {
  try {
    return await CMSPage.findOne({ slug, isPublished: true });
  } catch (error) {
    logger.error(`Get page failed: ${error.message}`);
    throw error;
  }
};

const getFAQs = async ({ category, page = 1, limit = 10 }) => {
  try {
    const query = { type: 'faq', isPublished: true };
    if (category) query.category = category;
    
    const skip = (page - 1) * limit;
    const faqs = await CMSPage.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ order: 1 });
    
    const total = await CMSPage.countDocuments(query);
    
    return {
      faqs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Get FAQs failed: ${error.message}`);
    throw error;
  }
};

const listBlogPosts = async ({ page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;
    const posts = await CMSPage.find({ type: 'blog', isPublished: true })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await CMSPage.countDocuments({ type: 'blog', isPublished: true });
    
    return {
      posts,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`List blog posts failed: ${error.message}`);
    throw error;
  }
};

const getBlogPostBySlug = async (slug) => {
  try {
    return await CMSPage.findOne({ slug, type: 'blog', isPublished: true });
  } catch (error) {
    logger.error(`Get blog post failed: ${error.message}`);
    throw error;
  }
};

// TODO: Admin methods
// const createPage = async (data) => { ... };
// const updatePage = async (pageId, updates) => { ... };
// const deletePage = async (pageId) => { ... };

module.exports = {
  getPageBySlug,
  getFAQs,
  listBlogPosts,
  getBlogPostBySlug,
};

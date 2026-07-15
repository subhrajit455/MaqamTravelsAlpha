const cmsService = require('./cms.service');
const { sendSuccess, sendNotFound } = require('../../utils/apiResponse');

/**
 * ─── CMS CONTROLLER ────────────────────────────────────
 * Thin layer: calls service, sends response
 */

const getPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const page = await cmsService.getPageBySlug(slug);
    if (!page) {
      return sendNotFound(res, 'Page not found');
    }
    
    return sendSuccess(res, { message: 'Page retrieved', data: page });
  } catch (error) {
    next(error);
  }
};

const getFAQs = async (req, res, next) => {
  try {
    const { category, page, limit } = req.query;
    
    const result = await cmsService.getFAQs({ category, page, limit });
    
    return sendSuccess(res, {
      message: 'FAQs retrieved',
      data: result.faqs,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const listBlogPosts = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await cmsService.listBlogPosts({ page, limit });
    
    return sendSuccess(res, {
      message: 'Blog posts retrieved',
      data: result.posts,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getBlogPost = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const post = await cmsService.getBlogPostBySlug(slug);
    if (!post) {
      return sendNotFound(res, 'Blog post not found');
    }
    
    return sendSuccess(res, { message: 'Blog post retrieved', data: post });
  } catch (error) {
    next(error);
  }
};

// TODO: Admin methods for creating/editing pages
// const createPage = async (req, res, next) => { ... };
// const updatePage = async (req, res, next) => { ... };
// const deletePage = async (req, res, next) => { ... };

module.exports = {
  getPage,
  getFAQs,
  listBlogPosts,
  getBlogPost,
};

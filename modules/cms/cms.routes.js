const router = require('express').Router();
const cmsController = require('./cms.controller');
const cmsValidator = require('./cms.validator');
const validate = require('../../middleware/validate');

/**
 * ─── CMS ROUTES ────────────────────────────────────────
 * Pattern: Manage static pages, FAQs, blog, etc.
 * Public read, admin write
 */

// Public routes
router.get('/pages/:slug', cmsValidator.validatePageSlug(), validate, cmsController.getPage);
router.get('/faqs', cmsController.getFAQs);
router.get('/blog', cmsController.listBlogPosts);
router.get('/blog/:slug', cmsValidator.validatePageSlug(), validate, cmsController.getBlogPost);

// Admin routes (TODO: Add admin middleware)
// router.post('/pages', adminMiddleware, cmsValidator.validateCreatePage(), validate, cmsController.createPage);
// router.put('/pages/:pageId', adminMiddleware, cmsValidator.validateUpdatePage(), validate, cmsController.updatePage);
// router.delete('/pages/:pageId', adminMiddleware, cmsController.deletePage);

module.exports = router;

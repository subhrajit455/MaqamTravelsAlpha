const router = require('express').Router();
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');
const validate = require('../../middleware/validate');

/**
 * ─── AUTH ROUTES ───────────────────────────────────────
 * Pattern: POST/GET requests for login, register, logout, refresh tokens
 */

// Public routes
router.post('/register', authValidator.validateRegister(), validate, authController.register);
router.post('/login', authValidator.validateLogin(), validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authValidator.validateForgotPassword(), validate, authController.forgotPassword);
router.post('/reset-password/:token', authValidator.validateResetPassword(), validate, authController.resetPassword);

module.exports = router;

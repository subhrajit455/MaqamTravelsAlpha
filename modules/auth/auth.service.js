const crypto = require('crypto');
const User = require('./auth.model');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');
const { generateTokens, generateRefreshAccessToken } = require('../../middleware/auth');


const registerUser = async ({ email = null, password, firstName, lastName, phone, avatar = null }) => {
  const normalizedPhone = phone?.trim();
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const hashedPassword = await bcrypt.hash(password, 10);
  const allowedAvatars = User.AVATAR_OPTIONS || [];

  if (avatar && !allowedAvatars.includes(avatar)) {
    throw new AppError('Invalid avatar selection', 400);
  }

  try {
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      throw new AppError('Phone number already registered', 409);
    }

    if (normalizedEmail) {
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail) {
        throw new AppError('Email already registered', 409);
      }
    }

    const user = await User.create({
      phone: normalizedPhone,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'customer',
      email: normalizedEmail || undefined,
      avatar: avatar || undefined,
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    logger.info(`User registered: ${phone}`);

    return {
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`Registration failed for ${phone}: ${error.message}`);
    throw error;
  }
};

const getAvatarOptions = () => {
  return User.AVATAR_OPTIONS || [];
};


const loginUser = async ({ phone, password }) => {
  try {
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    logger.info(`User logged in: ${phone}`);

    return {
      user: {
        id: user._id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
    };
  } catch (error) {
    logger.error(`Login failed for ${phone}: ${error.message}`);
    throw error;
  }
};


const refreshAccessToken = async (refreshToken) => {
  try {
    const accessToken = generateRefreshAccessToken(refreshToken);
    console.log("Access TOken", accessToken)
    return accessToken;
  } catch (error) {
    logger.error(`Token refresh failed: ${error.message}`);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    throw error;
  }
};


const forgotPassword = async (phone) => {
  const user = await User.findOne({ phone });
  if (!user) {
    throw new AppError('Phone number not found', 404);
  }
  // otp verification will be added later 
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset requested for phone: ${phone}`);

  return {
    resetToken,
    expiresAt: user.resetPasswordExpires,
  };
};


const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw new AppError('Invalid or expired password reset token', 401);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  logger.info(`Password reset complete for user: ${user.phone}`);

  return {
    id: user._id,
    phone: user.phone,
  };
};


const logoutUser = async (userId) => {
  try {
    logger.info(`User logged out: ${userId || 'anonymous'}`);
  } catch (error) {
    logger.error(`Logout failed: ${error.message}`);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  getAvatarOptions,
};



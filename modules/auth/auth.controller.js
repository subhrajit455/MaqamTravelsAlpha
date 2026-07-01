const authService = require("./auth.service");
const {
  sendSuccess,
  sendCreated,
  sendUnauthorized,
} = require("../../utils/apiResponse");

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    const { refreshToken, ...payload } = result;
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
    return sendCreated(res, result, "User registered successfully");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const result = await authService.loginUser({ phone, password });
    if (!result) {
      return sendUnauthorized(res, "Invalid phone or password");
    }

    const { refreshToken, ...payload } = result;
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return sendSuccess(res, {
      message: "Login successful",
      data: payload,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return sendUnauthorized(res, "Refresh token not provided");
    }

    const result = await authService.refreshAccessToken(refreshToken);
    console.log("result in refreshToken in authController:\n", result)
    return sendSuccess(res, { message: "Token refreshed", data: result.accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (userId) {
      await authService.logoutUser(userId);
    }

    res.clearCookie("accessToken", refreshTokenCookieOptions);
    res.clearCookie("refreshToken", refreshTokenCookieOptions);

    return sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await authService.forgotPassword(phone);

    return sendSuccess(res, {
      message: "Password reset token generated",
      data: { resetToken: result.resetToken, expiresAt: result.expiresAt },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const result = await authService.resetPassword(token, password);
    return sendSuccess(res, {
      message: "Password reset successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};

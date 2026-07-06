import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../stores/api";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5000/api/v1/auth/register",
        userData,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5000/api/v1/auth/login",
        userData,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5000/api/v1/auth/logout",
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (phoneData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5000/api/v1/auth/forgot-password",
        {
          phone: phoneData,
        },
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5000/api/v1/auth/verify-otp",
        {
          resetToken: otpData,
        },
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5000/api/v1/auth/reset-password",
        passwordData,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.144:5000/api/v1/auth/refresh-token",
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.pending, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(forgotPassword.pending, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(verifyOtp.pending, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(refreshToken.pending, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;

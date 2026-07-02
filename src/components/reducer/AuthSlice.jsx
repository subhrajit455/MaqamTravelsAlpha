import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../stores/api";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.144:5000/api/v1/auth/register",
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
        "http://192.168.0.144:5000/api/v1/auth/login",
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
        "http://192.168.0.144:5000/api/v1/auth/logout",
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
      });
  },
});

// export const { login, logout } = authSlice.actions;
export default authSlice.reducer;

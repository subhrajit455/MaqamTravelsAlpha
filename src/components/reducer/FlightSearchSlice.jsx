import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../stores/api";

export const fetchFlights = createAsyncThunk(
  "flightSearch/fetchFlights",
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://localhost:5000/api/v1/flights/search",
        searchParams,
      );

      console.log("API Response:", response);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const getFareQuote = createAsyncThunk(
  "flightSearch/getFareQuote",
  async (farequote, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://localhost:5000/api/v1/flights/farequote",
        farequote,
      );

      console.log("API Response:", response);

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const flightSearchSlice = createSlice({
  name: "flightSearch",
  initialState: {
    flightsData: [],
    fareQuote: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlights.fulfilled, (state, action) => {
        state.loading = false;
        state.flightsData = action.payload;
      })
      .addCase(fetchFlights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getFareQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFareQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.fareQuote = action.payload;
      })
      .addCase(getFareQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default flightSearchSlice.reducer;

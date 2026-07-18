import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../stores/api";

const searchFlights = {
  origin: "DEL",
  destination: "BOM",
  departureDate: "2026-08-15",
  returnDate: "2026-08-20",
  passengers: {
    adults: 1,
    children: 0,
    infants: 0,
  },
  journeyType: "oneway",
};

export const fetchFlights = createAsyncThunk(
  "flightSearch/fetchFlights",
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "http://192.168.0.105:5001/api/v1/flights/search",
        searchFlights,
      );

      console.log("API Response:", response); // Log the API response for debugging

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
      });
  },
});

export default flightSearchSlice.reducer;

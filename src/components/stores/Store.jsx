import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducer/AuthSlice";
import flightSearchReducer from "../reducer/FlightSearchSlice";
import getFareQuoteReducer from "../reducer/FlightSearchSlice";
const store = configureStore({
  reducer: {
    auth: authReducer,
    flightSearch: flightSearchReducer,
    getFareQuote: getFareQuoteReducer,
  },
});
export default store;

import React, { useEffect, useState } from "react";
import { Users, ArrowLeftRight } from "lucide-react";
import { MdFlight } from "react-icons/md";
import CommonHeader from "../components/CommonHeader";
import { FlightAPI } from "../configs/api";
import { toast } from "react-toastify";
import FlightCard from "../components/FlightList";

const FlightSearch = () => {
  // const [tripType, setTripType] = useState("oneway");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [selectedTravellers, setSelectedTravellers] = useState(1);
  // const [selectedClass, setSelectedClass] = useState("Economy");
  const [selectedDepartureDate, setSelectedDepartureDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [selectedReturnDate, setSelectedReturnDate] = useState("");
  const [flightList, setFlightList] = useState([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);

  const fetchFlightAccessApi = async () => {
    try {
      const res = await fetch(FlightAPI.FlightAccessApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      const token = result?.access_token;
      if (token) {
        setAccessToken(token);
        localStorage.setItem("flight_access_token", token);
        console.log("Flight Access token loaded");
      } else {
        console.warn(
          "No access token returned from Flight access API:",
          result,
        );
      }
    } catch (error) {
      console.error("Flight Access API error:", error);
    }
  };

  useEffect(() => {
    fetchFlightAccessApi();
  }, []);

  const formatSuggestion = (item) =>
    `${item?.name || ""} (${item?.iataCode || ""})` || item?.iataCode || "";

  const fetchFlightCitySuggestions = async (keyword) => {
    if (!keyword?.trim()) return [];
    try {
      setLoadingSuggestions(true);
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};
      const res = await fetch(
        `${FlightAPI.FlightCitySearchApi}?subType=AIRPORT&keyword=${encodeURIComponent(
          keyword.trim(),
        )}`,
        { headers },
      );
      const result = await res.json();
      console.log("Flight City Search API result:", result);
      return result?.data || [];
    } catch (error) {
      console.error("Flight City Search API error:", error);
      return [];
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (!fromQuery.trim()) {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const suggestions = await fetchFlightCitySuggestions(fromQuery);
      setFromSuggestions(suggestions);
      setShowFromSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [fromQuery]);

  useEffect(() => {
    if (!toQuery.trim()) {
      setToSuggestions([]);
      setShowToSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const suggestions = await fetchFlightCitySuggestions(toQuery);
      setToSuggestions(suggestions);
      setShowToSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [toQuery]);

  const handleSelectFrom = (suggestion) => {
    console.log("Selected From suggestion:", suggestion);
    setFromQuery(formatSuggestion(suggestion));
    setSelectedFrom(suggestion);
    setFromSuggestions([]);
    setShowFromSuggestions(false);
  };

  const handleSelectTo = (suggestion) => {
    setToQuery(formatSuggestion(suggestion));
    setSelectedTo(suggestion);
    setToSuggestions([]);
    setShowToSuggestions(false);
  };

  const handleSwapLocations = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
    setSelectedFrom(selectedTo);
    setSelectedTo(selectedFrom);
    setFromSuggestions([]);
    setToSuggestions([]);
    setShowFromSuggestions(false);
    setShowToSuggestions(false);
  };

  const getIataCode = (selectedItem, queryValue) => {
    if (selectedItem?.iataCode) return selectedItem.iataCode;
    const cleaned = queryValue?.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(cleaned) ? cleaned : "";
  };

  const handleSubmitSearch = () => {
    setIsLoading(true);
    const fromIata = getIataCode(selectedFrom, fromQuery);
    const toIata = getIataCode(selectedTo, toQuery);

    if (!fromIata) {
      toast.error("From city is required");
      setIsLoading(false);
      return;
    }

    if (!toIata) {
      toast.error("To city is required");
      setIsLoading(false);
      return;
    }

    if (!selectedDepartureDate) {
      toast.error("Departure date is required");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams({
      originLocationCode: fromIata,
      destinationLocationCode: toIata,
      departureDate: selectedDepartureDate,
      adults: selectedTravellers,
    });

    fetch(`${FlightAPI.FlightSearchApi}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        console.log("Flight Search API result:", result);
        if (!result?.data?.length) {
          toast.info("No flights found for the selected route and date.");
          setIsLoading(false);
          return;
        }
        toast.success("Flight search completed!" || result?.message);
        setIsLoading(false);
        setFlightList(result.data);
      })
      .catch((error) => {
        console.error("Flight Search API error:", error);
        toast.error(
          "Flight search failed. Please try again." || error?.message,
        );
        setIsLoading(false);
      });
  };
  const handlePriceConfirmation = async (flight) => {
    console.log("Initiating price confirmation for flight:", flight);
    setIsLoadingFlights(true);

    try {
      // Example: Call the Flight Price Confirmation API
      const res = await fetch(FlightAPI.FlightPriceConfirmationApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [flight], // Pass the selected flight offer details here
          },
        }),
      });
      const result = await res.json();
      console.log("Flight Price Confirmation API result:", result);
      if (result?.success) {
        toast.success(
          "Price confirmed! Proceeding to booking..." || result?.message,
        );
        setIsLoadingFlights(false);
        // Proceed with booking flow
      } else {
        toast.error(
          "Price confirmation failed. Please try again." || result?.message,
        );
        setIsLoadingFlights(false);
      }
    } catch (error) {
      console.error("Flight Price Confirmation API error:", error);
      toast.error(
        "Price confirmation failed. Please try again." || error?.message,
      );
      setIsLoadingFlights(false);
    }
  };

  return (
    <>
      <CommonHeader title="Flight" />

      <div className="flex justify-center  items-center p-6 font-poppins">
        {/* CARD */}
        <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-7xl p-8">
          {/* HEADER */}
          <h1 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-2">
            <MdFlight size={40} /> Search Flights
          </h1>

          {/* TRIP TYPE */}
          {/* <div className="flex gap-4 mb-6">
            {["oneway", "round", "multi"].map((type) => (
              <button
                key={type}
                onClick={() => setTripType(type)}
                className={`px-5 py-2 rounded-full font-medium capitalize transition cursor-pointer ${
                  tripType === type
                    ? "bg-teal-600 text-white "
                    : "bg-teal-100 text-teal-600"
                }`}
              >
                {type === "oneway"
                  ? "One Way"
                  : type === "round"
                    ? "Round Trip"
                    : "Multi City"}
              </button>
            ))}
          </div> */}

          {/* SEARCH FIELDS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            {/* FROM */}
            <div className="bg-teal-100 p-4 rounded-xl relative cursor-pointer">
              <p className="text-xs text-teal-500">From</p>
              <input
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setSelectedFrom(null);
                }}
                onFocus={() =>
                  fromSuggestions.length > 0 && setShowFromSuggestions(true)
                }
                placeholder="City"
                className="bg-transparent outline-none w-full font-semibold placeholder:text-teal-600"
              />
              {showFromSuggestions && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-xl border border-teal-200 bg-white shadow-lg">
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : fromSuggestions.length > 0 ? (
                    fromSuggestions.map((item, index) => (
                      <button
                        type="button"
                        key={`${formatSuggestion(item)}-${index}`}
                        onClick={() => handleSelectFrom(item)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-teal-50"
                      >
                        {formatSuggestion(item)}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No cities found.
                    </div>
                  )}
                </div>
              )}
              {/* {formErrors.from && (
                <p className="mt-2 text-sm text-red-600">{formErrors.from}</p>
              )} */}
            </div>

            {/* SWAP */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="bg-teal-100 p-3 rounded-full hover:rotate-180 transition cursor-pointer"
              >
                <ArrowLeftRight className="text-teal-600" />
              </button>
            </div>

            {/* TO */}
            <div className="bg-teal-100 p-4 rounded-xl relative cursor-pointer">
              <p className="text-xs text-teal-500">To</p>
              <input
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setSelectedTo(null);
                }}
                onFocus={() =>
                  toSuggestions.length > 0 && setShowToSuggestions(true)
                }
                placeholder="City"
                className="bg-transparent outline-none w-full font-semibold placeholder:text-teal-600"
              />
              {showToSuggestions && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-xl border border-teal-200 bg-white shadow-lg">
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : toSuggestions.length > 0 ? (
                    toSuggestions.map((item, index) => (
                      <button
                        type="button"
                        key={`${formatSuggestion(item)}-${index}`}
                        onClick={() => handleSelectTo(item)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-teal-50"
                      >
                        {formatSuggestion(item)}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No cities found.
                    </div>
                  )}
                </div>
              )}
              {/* {formErrors.to && (
                <p className="mt-2 text-sm text-red-600">{formErrors.to}</p>
              )} */}
            </div>

            {/* DEPART */}
            <div className="bg-teal-100 p-4 rounded-xl flex flex-col gap-2">
              <input
                type="date"
                className="bg-transparent outline-none w-full placeholder:text-teal-800 cursor-pointer"
                value={selectedDepartureDate}
                min={new Date().toISOString().split("T")[0]} // ✅ prevents past dates
                onChange={(e) => setSelectedDepartureDate(e.target.value)}
              />
              {/* {formErrors.departureDate && (
                <p className="text-sm text-red-600">
                  {formErrors.departureDate}
                </p>
              )} */}
            </div>

            <div className="bg-teal-100 p-4 rounded-xl flex items-center gap-2 ">
              <Users className="text-teal-400" />
              <select
                className="bg-transparent w-full outline-none cursor-pointer"
                value={selectedTravellers}
                onChange={(e) => setSelectedTravellers(e.target.value)}
              >
                <option value={1}>1 Traveller</option>
                <option value={2}>2 Travellers</option>
                <option value={3}>3 Travellers</option>
              </select>
            </div>

            {/* RETURN */}
            {/* <div
              className={`bg-teal-100 p-4 rounded-xl flex items-center gap-2  ${
                tripType !== "round" && "opacity-50 pointer-events-none "
              }`}
            >
              
              <input
                type="date"
                className="bg-transparent outline-none w-full placeholder:text-teal-800 cursor-pointer"
              />
            </div> */}
          </div>

          {/* PASSENGERS */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {/* <div className="bg-teal-100 p-4 rounded-xl">
              <select className="bg-transparent w-full outline-none cursor-pointer" value={}>
                <option>Economy</option>
                <option>Business</option>
                <option>First Class</option>
              </select>
            </div> */}

            {/* SEARCH BUTTON */}
            {isLoading ? (
              <button
                className="bg-teal-600 text-white rounded-xl font-semibold text-lg cursor-not-allowed py-3"
                disabled
              >
                Searching...
              </button>
            ) : (
              <button
                className="bg-teal-600 text-white rounded-xl font-semibold text-lg cursor-pointer hover:bg-teal-700 transition py-3"
                onClick={handleSubmitSearch}
              >
                Search Flights
              </button>
            )}
          </div>
        </div>
      </div>
      {flightList.length > 0 && (
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-2xl font-bold text-teal-800 mb-4">
            Available Flights
          </h2>
          <div className="flex flex-col gap-6">
            {flightList.map((flight, index) => (
              <FlightCard
                key={index}
                flight={flight}
                handlePriceConfirmation={handlePriceConfirmation}
                isLoadingFlights={isLoadingFlights}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default FlightSearch;

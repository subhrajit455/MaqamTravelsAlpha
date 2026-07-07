import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  Contact,
  ArrowLeft,
  ArrowRight,
  Plane,
} from "lucide-react";
import CommonHeader from "../components/CommonHeader";
import { FlightAPI } from "../configs/api";
import { toast } from "react-toastify";
import FlightCard from "../components/FlightList";
const travellingWay = ["One Way", "Round Trip", " Multi City"];
const fareTypes = [
  "Regular Fare",
  "Student Fare",
  "Armed Force",
  "Senior Citizen",
];

const dummySuggestions = [
  {
    id: 1,
    name: "Delhi",
    airport: "Indira Gandhi International Airport",
    iataCode: "DEL",
    countryCode: "IN",
  },
  {
    id: 2,
    name: "Mumbai",
    airport: "Chhatrapati Shivaji Maharaj International Airport",
    iataCode: "BOM",
    countryCode: "IN",
  },
  {
    id: 3,
    name: "Bengaluru",
    airport: "Kempegowda International Airport",
    iataCode: "BLR",
    countryCode: "IN",
  },
  {
    id: 4,
    name: "Hyderabad",
    airport: "Rajiv Gandhi International Airport",
    iataCode: "HYD",
    countryCode: "IN",
  },
  {
    id: 5,
    name: "Kolkata",
    airport: "Netaji Subhas Chandra Bose International Airport",
    iataCode: "CCU",
    countryCode: "IN",
  },
];

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
  const [activeTab, setActiveTab] = useState("One Way");
  const [selectedFare, setSelectedFare] = useState("Regular Fare");

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
    `${item?.name || ""} ` || item?.iataCode || "";

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
      <div className="relative pb-[500px] lg:pb-40">
        <CommonHeader title="Flight" />
        <div className="absolute top-52 md:top-60 lg:top-72 left-1/2 -translate-x-1/2 w-[95%] lg:w-[60%] bg-white rounded-xl p-6 shadow-md">
          <div className="w-full lg:w-11/12 mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 z-10 top-2 relative">
            {/* Left Side */}
            <div className="flex justify-center lg:justify-start">
              <div className="inline-flex flex-wrap gap-2 bg-gray-200 px-3 py-1 rounded-3xl">
                {travellingWay?.map((way, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveTab(way)}
                    className={`px-4 py-1 rounded-3xl font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap ${
                      activeTab === way
                        ? "bg-green-800 text-white"
                        : "bg-transparent text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {way}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side */}
            <div className="text-center lg:text-right">
              <h6 className="text-lg font-medium">
                Book Domestic and International Flight
              </h6>
            </div>
          </div>

          <div className="relative w-11/12 mx-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border border-gray-200 rounded-lg w-full mx-auto m-4 overflow-hidden">
              {/* From */}
              <div className="relative p-4 cursor-pointer hover:bg-gray-50 transition">
                <p className="text-xs text-gray-800 uppercase tracking-wide mb-1 font-bold">
                  Departure Airport
                </p>

                <input
                  type="text"
                  value={fromQuery}
                  onFocus={() => {
                    setFromSuggestions(dummySuggestions);
                    setShowFromSuggestions(true);
                  }}
                  onChange={(e) => setFromQuery(e.target.value)}
                  placeholder="Enter city or airport"
                  className="w-full text-2xl font-bold outline-none bg-transparent"
                />

                <p className="text-sm text-gray-600 truncate">
                  {selectedFrom?.name || "Search Airport"}
                </p>
              </div>

              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-72 overflow-y-auto">
                  {fromSuggestions.map((airport) => (
                    <button
                      key={airport.id || airport.iataCode}
                      onClick={() => handleSelectFrom(airport)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Plane size={18} className="text-blue-600" />

                        <div className="text-left">
                          <p className="font-semibold">{airport.name}</p>

                          <p className="text-xs text-gray-500">
                            {airport.address?.cityName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg">{airport.iataCode}</p>
                        <p className="text-xs text-gray-400">
                          {airport.address?.countryCode}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* To */}
              <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                <p className="text-xs text-gray-800 uppercase tracking-wide mb-1 font-bold">
                  Arrival Airport
                </p>
                <p className="text-2xl font-bold text-gray-900">Bengaluru</p>
                <p className="text-sm text-gray-600">
                  BLR, Kempegowda International Airport
                </p>
              </div>

              {/* Departure */}
              <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Departure
                  </p>
                  <ChevronDown className="w-4 h-4 text-[#2276E3]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">2 Jul 26</p>
                <p className="text-sm text-gray-600">Monday</p>
              </div>

              {/* Return */}
              <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Return
                  </p>
                  <ChevronDown className="w-4 h-4 text-[#2276E3]" />
                </div>
                <p className="text-lg font-medium text-gray-400">
                  Tap to add date
                </p>
              </div>

              {/* Travellers & Class */}
              <div className="p-4 border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Travellers & Class
                  </p>
                  <ChevronDown className="w-4 h-4 text-[#2276E3]" />
                </div>
                <p className="text-lg font-medium text-gray-900">1 Traveller</p>
                <p className="text-sm text-gray-600">Economy</p>
              </div>
            </div>
            {/* Swap Button */}
            <button
              className="
                  hidden 
                  lg:flex
                  absolute
                  left-[20%]
                  top-1/2
                  -translate-x-1/2
                  -translate-y-1/2
                  w-10
                  h-10
                  rounded-full
                  bg-green-800    
                  items-center
                  justify-center
                  shadow-lg
                  border-4
                  border-white
                  z-20
                  cursor-pointer
                "
            >
              <div className="flex flex-col -space-y-1">
                <ArrowLeft size={14} strokeWidth={3} className="text-white" />
                <ArrowRight size={14} strokeWidth={3} className="text-white" />
              </div>
            </button>
          </div>

          <div className="flex gap-4  w-11/12 mx-auto mt-6">
            <h3 className="text-LG font-bold text-gray-700 mb-3">
              SELECT A FARE TYPE
            </h3>

            <div className="flex flex-wrap gap-3 -mt-2">
              {fareTypes.map((fare) => (
                <label
                  key={fare}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all duration-300 ${
                    selectedFare === fare
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="fareType"
                    value={fare}
                    checked={selectedFare === fare}
                    onChange={() => setSelectedFare(fare)}
                    className="accent-green-600"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    {fare}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center relative">
            <button
              className="absolute top-1 bg-gradient-to-r from-green-800 to-green-600
             hover:from-green-800 to-green-600
             text-white font-bold uppercase
             px-8 py-3
             rounded-md
             shadow-md
             transition-all duration-300
             cursor-pointer"
            >
              Search Flight
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlightSearch;

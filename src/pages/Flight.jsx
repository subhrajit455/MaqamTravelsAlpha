import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeparturePlace from "./DeparturePlace";
import ArrivalPlace from "./ArrivalPlace";
import TravellerClass from "../components/travellerclasses/TravellerClass";
import HotelSearch from "./HotelSearch";
import {
  ChevronDown,
  Contact,
  ArrowLeft,
  ArrowRight,
  Plane,
  Building2,
  Home,
  Package,
} from "lucide-react";
import CommonHeader from "../components/CommonHeader";
import { FlightAPI } from "../configs/api";
import { toast } from "react-toastify";
import FlightCard from "../components/FlightList";
import SelectFareType from "../components/selectfaretype/SelectFareType";

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

const farePrice = [
  {
    date: "2026-11-08",
    price: 4299,
  },
  {
    date: "2026-11-09",
    price: 3899,
  },
  {
    date: "2026-11-10",
    price: 5199,
  },
];

const travellClass = [
  "All",
  "Economy",
  "Premium Economy",
  "Business",
  "Premium Business",
  "First Class",
];

const services = [
  {
    name: "FLIGHT",
    icon: Plane,
    active: true,
  },
  {
    name: "HOTEL",
    icon: Building2,
    active: false,
  },
];

const FlightSearch = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [searchbox, setSearchbox] = useState("FLIGHT");
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
  const [selectedClass, setSelectedClass] = useState(false);
  const [travellers, setTravellers] = useState({
    adult: 1,
    child: 0,
    infant: 0,
    travelClass: "Economy",
  });
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

  const handleTravellClass = () => {};

  const getIataCode = (selectedItem, queryValue) => {
    if (selectedItem?.iataCode) return selectedItem.iataCode;
    const cleaned = queryValue?.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(cleaned) ? cleaned : "";
  };

  // const handleSubmitSearch = () => {
  //   setIsLoading(true);
  //   const fromIata = getIataCode(selectedFrom, fromQuery);
  //   const toIata = getIataCode(selectedTo, toQuery);

  //   if (!fromIata) {
  //     toast.error("From city is required");
  //     setIsLoading(false);
  //     return;
  //   }

  //   if (!toIata) {
  //     toast.error("To city is required");
  //     setIsLoading(false);
  //     return;
  //   }

  //   if (!selectedDepartureDate) {
  //     toast.error("Departure date is required");
  //     setIsLoading(false);
  //     return;
  //   }

  //   const params = new URLSearchParams({
  //     originLocationCode: fromIata,
  //     destinationLocationCode: toIata,
  //     departureDate: selectedDepartureDate,
  //     adults: selectedTravellers,
  //   });

  //   fetch(`${FlightAPI.FlightSearchApi}?${params.toString()}`, {
  //     method: "GET",
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   })
  //     .then((res) => res.json())
  //     .then((result) => {
  //       console.log("Flight Search API result:", result);
  //       if (!result?.data?.length) {
  //         toast.info("No flights found for the selected route and date.");
  //         setIsLoading(false);
  //         return;
  //       }
  //       toast.success("Flight search completed!" || result?.message);
  //       setIsLoading(false);
  //       setFlightList(result.data);
  //     })
  //     .catch((error) => {
  //       console.error("Flight Search API error:", error);
  //       toast.error(
  //         "Flight search failed. Please try again." || error?.message,
  //       );
  //       setIsLoading(false);
  //     });
  // };
  // const handlePriceConfirmation = async (flight) => {
  //   console.log("Initiating price confirmation for flight:", flight);
  //   setIsLoadingFlights(true);

  //   try {
  //     // Example: Call the Flight Price Confirmation API
  //     const res = await fetch(FlightAPI.FlightPriceConfirmationApi, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //       body: JSON.stringify({
  //         data: {
  //           type: "flight-offers-pricing",
  //           flightOffers: [flight], // Pass the selected flight offer details here
  //         },
  //       }),
  //     });
  //     const result = await res.json();
  //     console.log("Flight Price Confirmation API result:", result);
  //     if (result?.success) {
  //       toast.success(
  //         "Price confirmed! Proceeding to booking..." || result?.message,
  //       );
  //       setIsLoadingFlights(false);
  //       // Proceed with booking flow
  //     } else {
  //       toast.error(
  //         "Price confirmation failed. Please try again." || result?.message,
  //       );
  //       setIsLoadingFlights(false);
  //     }
  //   } catch (error) {
  //     console.error("Flight Price Confirmation API error:", error);
  //     toast.error(
  //       "Price confirmation failed. Please try again." || error?.message,
  //     );
  //     setIsLoadingFlights(false);
  //   }
  // };

  return (
    <>
      <div className="relative  lg:pb-40">
        <CommonHeader title="Flight" />

        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-40px] z-50 top-100 w-full px-4">
          <div className="relative grid grid-rows-2 justify-items-center items-center">
            <div className="w-64 max-w-sm mx-auto z-50 mb-110">
              <div className="grid grid-cols-2 gap-3">
                {services.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      onClick={() => setSearchbox(item.name)}
                      key={item.name}
                      className={`
                        h-16
                        rounded-lg
                        shadow-md
                        flex
                        flex-col
                        items-center
                        justify-center
                        transition-all
                        duration-300
                        cursor-pointer
                        ${
                          searchbox === item.name
                            ? "bg-gradient-to-r from-green-800 to-green-600 text-white"
                            : "bg-white text-[#FF7A00] hover:bg-orange-50"
                        }
                      `}
                    >
                      <Icon size={24} strokeWidth={2.2} className="mb-2" />

                      <span className="text-sm font-bold tracking-wide">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {searchbox === "FLIGHT" && (
              <div className="absolute  md:top-60 lg:top-10 left-1/2 -translate-x-1/2 w-[100%] lg:w-[80%] bg-white rounded-3xl  backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                <div className="w-full lg:w-[100%] mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 z-10 top-2 lg:relative">
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

                <div className="relative w-[100%] mx-auto mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border border-gray-200 rounded-lg w-full mx-auto m-4">
                    {/* From */}
                    <div
                      onClick={() => {
                        setFromSuggestions(dummySuggestions);
                        setShowFromSuggestions(true);
                      }}
                      className="relative p-4 cursor-pointer hover:bg-gray-50 transition"
                    >
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
                        {selectedFrom?.airport || "Search Airport"}
                      </p>
                    </div>

                    <DeparturePlace
                      fromSuggestions={fromSuggestions}
                      showFromSuggestions={showFromSuggestions}
                      setFromQuery={setFromQuery}
                      formatSuggestion={formatSuggestion}
                      selectedFrom={selectedFrom}
                      setSelectedFrom={setSelectedFrom}
                    />
                    {/* To */}
                    <div
                      onClick={() => {
                        setToSuggestions(dummySuggestions);
                        setShowToSuggestions(true);
                      }}
                      className="p-4 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <p className="text-xs text-gray-800 uppercase tracking-wide mb-1 font-bold px-2">
                        Arrival Airport
                      </p>
                      <input
                        type="text"
                        value={toQuery}
                        onFocus={() => {
                          setToSuggestions(dummySuggestions);
                          setShowToSuggestions(true);
                        }}
                        onChange={(e) => setToQuery(e.target.value)}
                        placeholder="Enter city or airport"
                        className="w-full text-2xl font-bold outline-none bg-transparent px-2"
                      />
                      <p className="text-sm text-gray-600 truncate px-2">
                        {selectedTo?.airport || "Search Airport"}
                      </p>
                    </div>

                    <ArrivalPlace
                      toSuggestions={toSuggestions}
                      showToSuggestions={showToSuggestions}
                      setToQuery={setToQuery}
                      formatSuggestion={formatSuggestion}
                      selectedTo={selectedTo}
                      setSelectedTo={setSelectedTo}
                    />

                    {/* Departure */}
                    <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Departure
                        </p>
                        <ChevronDown className="w-4 h-4 text-[#2276E3]" />
                      </div>
                      {/* <p className="text-2xl font-bold text-gray-900">2 Jul 26</p>
                <p className="text-sm text-gray-600">Monday</p> */}

                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        dateFormat="d MMM''yy"
                        wrapperClassName="w-full"
                        className="w-full text-2xl font-bold text-gray-900 outline-none bg-transparent"
                      />

                      <p className="text-sm text-gray-600">
                        {startDate
                          ? startDate.toLocaleDateString("en-US", {
                              weekday: "long",
                            })
                          : ""}
                      </p>
                    </div>

                    {/* Return */}
                    <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Return
                        </p>
                        <ChevronDown className="w-4 h-4 text-[#2276E3]" />
                      </div>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        dateFormat="d MMM''yy"
                        wrapperClassName="w-full"
                        className="w-full text-2xl font-bold text-gray-900 outline-none bg-transparent"
                      />

                      <p className="text-sm text-gray-600">
                        {endDate
                          ? endDate.toLocaleDateString("en-US", {
                              weekday: "long",
                            })
                          : ""}
                      </p>
                    </div>

                    {/* Travellers & Class */}
                    <TravellerClass
                      travellers={travellers}
                      setTravellers={setTravellers}
                      setSelectedClass={setSelectedClass}
                      selectedClass={selectedClass}
                    />
                  </div>
                  {/* Swap Button */}
                  <button
                    onClick={handleSwapLocations}
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
                      <ArrowLeft
                        size={14}
                        strokeWidth={3}
                        className="text-white"
                      />
                      <ArrowRight
                        size={14}
                        strokeWidth={3}
                        className="text-white"
                      />
                    </div>
                  </button>
                </div>

                {/*Select Fare Type*/}

                <SelectFareType
                  fareTypes={fareTypes}
                  selectedFare={selectedFare}
                  setSelectedFare={setSelectedFare}
                />

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
                    Search {searchbox}
                  </button>
                </div>
              </div>
            )}

            {searchbox === "HOTEL" && <HotelSearch searchbox={searchbox} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default FlightSearch;

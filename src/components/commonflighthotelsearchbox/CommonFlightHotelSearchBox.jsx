import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeparturePlace from "../../pages/DeparturePlace";
import ArrivalPlace from "../../pages/ArrivalPlace";
import TravellerClass from "../travellerclasses/TravellerClass";
import HotelSearch from "../../pages/HotelSearch";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchFlights } from "../reducer/FlightSearchSlice";
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

// import { FlightAPI } from "../configs/api";
import { toast } from "react-toastify";
// import FlightCard from "../components/FlightList";
import SelectFareType from "../selectfaretype/SelectFareType";
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

const CommonFlightHotelSearchBox = ({
  selectedFare,
  setSelectedFare,
  headerChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { flightsData, loading, error } = useSelector(
    (state) => state.flightSearch,
  );
  const [activeTab, setActiveTab] = useState("One Way");
  const [searchbox, setSearchbox] = useState("FLIGHT");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
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
  const [showNavbar, setShowNavbar] = useState(true);
  const [isDisabled, setIsDisabled] = useState(true);
  const formatSuggestion = (item) =>
    `${item?.name || ""} ` || item?.iataCode || "";
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

  const handleNavbar = () => {
    setShowNavbar(true);
  };

  const searchFlights = {
    origin: selectedFrom?.iataCode,
    destination: selectedTo?.iataCode,
    departureDate: startDate?.toISOString().split("T")[0],
    returnDate: endDate?.toISOString().split("T")[0],
    passengers: {
      adults: travellers?.adult,
      children: travellers?.child,
      infants: travellers?.infant,
    },
    journeyType: travellers?.travelClass,
  };

  const handleFlightSearch = () => {
    // Save search payload
    localStorage.setItem("flightSearch", JSON.stringify(searchFlights));

    // Dispatch API
    dispatch(fetchFlights(searchFlights));
  };

  return (
    <>
      {headerChange ? (
        <div className="relative w-full px-4 py-4 z-40">
          <div className="relative flex flex-col items-center max-w-full mx-auto">
            {/* Flight Search Card Container */}
            {searchbox === "FLIGHT" && (
              <div className="w-full lg:w-[90%] bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 transition-all">
                <div className="relative">
                  {/* Grid of Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                    {/* Departure Airport */}
                    <div
                      onClick={() => {
                        setFromSuggestions(dummySuggestions);
                        setShowFromSuggestions(true);
                      }}
                      className="relative cursor-pointer hover:bg-teal-50/15 group transition duration-300 p-4 flex flex-col justify-between"
                    >
                      <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
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
                        className="text-sm font-extrabold text-gray-900 outline-none bg-transparent w-full truncate focus:text-teal-700 transition"
                      />
                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
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
                      setFromSuggestions={setFromSuggestions}
                      setShowFromSuggestions={setShowFromSuggestions}
                      isDisabled={isDisabled}
                      setIsDisabled={setIsDisabled}
                    />

                    {/* Arrival Airport */}
                    <div
                      onClick={() => {
                        setToSuggestions(dummySuggestions);
                        setShowToSuggestions(true);
                      }}
                      className="border-t md:border-t-0 md:border-l border-gray-100 cursor-pointer hover:bg-teal-50/15 group transition duration-300 p-4 flex flex-col justify-between"
                    >
                      <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
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
                        className="w-full box-border px-3 text-lg font-extrabold text-gray-900 outline-none bg-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
                        {selectedTo?.airport || "Search Airport"}
                      </p>
                    </div>

                    <ArrivalPlace
                      toSuggestions={toSuggestions}
                      showToSuggestions={showToSuggestions}
                      setToQuery={setToQuery}
                      formatSuggestion={formatSuggestion}
                      selectedTo={selectedTo}
                      setToSuggestions={setToSuggestions}
                      setSelectedTo={setSelectedTo}
                      setShowToSuggestions={setShowToSuggestions}
                      isDisabled={isDisabled}
                      setIsDisabled={setIsDisabled}
                    />

                    {/* Departure Date */}
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 cursor-pointer hover:bg-teal-50/15 group transition duration-300 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                          Departure
                        </p>
                        <ChevronDown className="w-3.5 h-3.5 text-teal-600 transition-transform group-hover:translate-y-0.5" />
                      </div>

                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        dateFormat="d MMM''yy"
                        wrapperClassName="w-full"
                        className="w-full text-sm font-extrabold text-gray-900 outline-none bg-transparent cursor-pointer focus:text-teal-700 transition"
                      />

                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
                        {startDate
                          ? startDate.toLocaleDateString("en-US", {
                              weekday: "long",
                            })
                          : ""}
                      </p>
                    </div>

                    {/* Return Date */}
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 cursor-pointer hover:bg-teal-50/15 group transition duration-300 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                          Return
                        </p>
                        <ChevronDown className="w-3.5 h-3.5 text-teal-600 transition-transform group-hover:translate-y-0.5" />
                      </div>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        dateFormat="d MMM''yy"
                        wrapperClassName="w-full"
                        className="w-full text-sm font-extrabold text-gray-900 outline-none bg-transparent cursor-pointer focus:text-teal-700 transition"
                      />

                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
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
                      isDisabled={isDisabled}
                      setIsDisabled={setIsDisabled}
                    />
                  </div>

                  {/* Location Swap Button */}
                  <button
                    onClick={handleSwapLocations}
                    title="Swap Departure & Arrival"
                    className="
                      hidden 
                      lg:flex
                      absolute
                      left-[20%]
                      top-1/2
                      -translate-x-1/2
                      -translate-y-1/2
                      w-9
                      h-9
                      rounded-full
                      bg-white
                      border
                      border-gray-100
                      text-teal-700
                      hover:bg-teal-600
                      hover:text-white
                      items-center
                      justify-center
                      shadow-md
                      z-30
                      cursor-pointer
                      transition-all
                      duration-500
                      hover:rotate-180
                      active:scale-95
                    "
                  >
                    <div className="flex flex-col -space-y-1">
                      <ArrowLeft size={12} strokeWidth={2.5} />
                      <ArrowRight size={12} strokeWidth={2.5} />
                    </div>
                  </button>
                </div>

                {/* Bottom Bar: Fare Type Selection & Search Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pt-2 border-t border-gray-100">
                  <div className="w-full sm:w-auto">
                    <SelectFareType
                      fareTypes={fareTypes}
                      selectedFare={selectedFare}
                      setSelectedFare={setSelectedFare}
                    />
                  </div>

                  <button
                    disabled={isDisabled}
                    onClick={() => handleFlightSearch()}
                    className={`
                      w-full sm:w-auto
                      bg-gradient-to-r from-teal-600 to-emerald-600
                      hover:from-teal-700 hover:to-emerald-700
                      text-white font-bold text-xs uppercase tracking-wider
                      px-8 py-3
                      rounded-full shadow-md hover:shadow-lg
                      transition-all duration-300
                      ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer active:scale-95"
                      }
                    `}
                  >
                    Search {searchbox}
                  </button>
                </div>
              </div>
            )}

            {searchbox === "HOTEL" && <HotelSearch searchbox={searchbox} />}
          </div>
        </div>
      ) : (
        <div className="w-full px-4 relative z-40 pointer-events-auto">
          <div className="relative flex flex-col items-center justify-center">
            {/* Service selector tabs (Flight/Hotel selector) */}
            <div className="w-fit mx-auto z-50 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-100 flex gap-2">
              {services.map((item) => {
                const Icon = item.icon;
                const isSelected = searchbox === item.name;
                return (
                  <button
                    onClick={() => setSearchbox(item.name)}
                    key={item.name}
                    className={`
                      px-6 py-2.5
                      rounded-full
                      flex items-center gap-2
                      transition-all duration-300
                      cursor-pointer text-xs font-bold tracking-wider
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/10"
                          : "bg-transparent text-gray-700 hover:bg-teal-50/20"
                      }
                    `}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {searchbox === "FLIGHT" && (
              <div className="w-full bg-white rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 pb-12 relative pointer-events-auto">
                <div className="w-full mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  {/* Left Side: travellingWay selection */}
                  <div className="flex justify-center lg:justify-start">
                    <div className="inline-flex flex-wrap gap-1 bg-gray-100 p-1 rounded-full border border-gray-200/50">
                      {travellingWay?.map((way, index) => (
                        <div
                          key={index}
                          onClick={() => setActiveTab(way)}
                          className={`px-5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${
                            activeTab === way
                              ? "bg-teal-600 text-white shadow-sm"
                              : "bg-transparent text-gray-600 hover:bg-gray-200/60"
                          }`}
                        >
                          {way}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side Info */}
                  <div className="text-center lg:text-right">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest bg-teal-50 px-3 py-1.5 rounded-full">
                      Book Domestic and International Flights
                    </span>
                  </div>
                </div>

                <div className="relative w-full mx-auto mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border border-gray-100 rounded-2xl w-full mx-auto bg-white overflow-hidden shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-gray-100 my-4">
                    {/* From */}
                    <div
                      onClick={() => {
                        setFromSuggestions(dummySuggestions);
                        setShowFromSuggestions(true);
                      }}
                      className="relative p-4 cursor-pointer hover:bg-teal-50/15 group transition duration-300 flex flex-col justify-between"
                    >
                      <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
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
                        className="w-full text-lg font-extrabold text-gray-900 outline-none bg-transparent focus:text-teal-700 transition"
                      />
                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
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
                      setFromSuggestions={setFromSuggestions}
                      setShowFromSuggestions={setShowFromSuggestions}
                      setIsDisabled={setIsDisabled}
                    />

                    {/* To */}
                    <div
                      onClick={() => {
                        setToSuggestions(dummySuggestions);
                        setShowToSuggestions(true);
                      }}
                      className="p-4 border-t md:border-t-0 md:border-l border-gray-100 cursor-pointer hover:bg-teal-50/15 group transition duration-300 flex flex-col justify-between"
                    >
                      <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
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
                        className="w-full box-border px-3 text-lg font-extrabold text-gray-900 outline-none bg-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
                        {selectedTo?.airport || "Search Airport"}
                      </p>
                    </div>

                    <ArrivalPlace
                      toSuggestions={toSuggestions}
                      showToSuggestions={showToSuggestions}
                      setToQuery={setToQuery}
                      formatSuggestion={formatSuggestion}
                      selectedTo={selectedTo}
                      setToSuggestions={setToSuggestions}
                      setSelectedTo={setSelectedTo}
                      setShowToSuggestions={setShowToSuggestions}
                    />

                    {/* Departure */}
                    <div className="p-4 border-t md:border-t-0 md:border-l border-gray-100 cursor-pointer hover:bg-teal-50/15 group transition duration-300 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                          Departure
                        </p>
                        <ChevronDown className="w-3.5 h-3.5 text-teal-600 transition-transform group-hover:translate-y-0.5" />
                      </div>

                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        dateFormat="d MMM''yy"
                        wrapperClassName="w-full"
                        className="w-full text-lg font-extrabold text-gray-900 outline-none bg-transparent cursor-pointer focus:text-teal-700 transition"
                      />

                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
                        {startDate
                          ? startDate.toLocaleDateString("en-US", {
                              weekday: "long",
                            })
                          : ""}
                      </p>
                    </div>

                    {/* Return */}
                    <div className="p-4 border-t md:border-t-0 md:border-l border-gray-100 cursor-pointer hover:bg-teal-50/15 group transition duration-300 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                          Return
                        </p>
                        <ChevronDown className="w-3.5 h-3.5 text-teal-600 transition-transform group-hover:translate-y-0.5" />
                      </div>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        dateFormat="d MMM''yy"
                        wrapperClassName="w-full"
                        className="w-full text-lg font-extrabold text-gray-900 outline-none bg-transparent cursor-pointer focus:text-teal-700 transition"
                      />

                      <p className="text-xs text-gray-400 mt-1 font-medium truncate group-hover:text-teal-600 transition">
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
                    title="Swap Departure & Arrival"
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
                      bg-white
                      border
                      border-gray-100
                      text-teal-700
                      hover:bg-teal-600
                      hover:text-white
                      items-center
                      justify-center
                      shadow-md
                      z-30
                      cursor-pointer
                      transition-all
                      duration-500
                      hover:rotate-180
                      active:scale-95
                    "
                  >
                    <div className="flex flex-col -space-y-1">
                      <ArrowLeft size={14} strokeWidth={2.5} />
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </div>
                  </button>
                </div>

                {/*Select Fare Type*/}
                <div className="mb-4">
                  <SelectFareType
                    fareTypes={fareTypes}
                    selectedFare={selectedFare}
                    setSelectedFare={setSelectedFare}
                  />
                </div>

                {/* Search Button centered floating at the bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-40">
                  <button
                    onClick={() => {
                      handleFlightSearch();
                      navigate("/flight-list", {
                        state: {
                          flights: [
                            {
                              searchFlights: searchFlights,
                              showNavbar: showNavbar,
                            },
                          ],
                        },
                      });
                    }}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm uppercase tracking-wider px-10 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer whitespace-nowrap"
                  >
                    Search {searchbox}
                  </button>
                </div>
              </div>
            )}

            {searchbox === "HOTEL" && (
              <HotelSearch
                searchbox={searchbox}
                handleFlightSearch={handleFlightSearch}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CommonFlightHotelSearchBox;

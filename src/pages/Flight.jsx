import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeparturePlace from "./DeparturePlace";
import ArrivalPlace from "./ArrivalPlace";
import TravellerClass from "../components/travellerclasses/TravellerClass";
import HotelSearch from "./HotelSearch";
import CommonFlightHotelSearchBox from "../components/commonflighthotelsearchbox/CommonFlightHotelSearchBox";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  // useEffect(() => {
  //   if (!fromQuery.trim()) {
  //     setFromSuggestions([]);
  //     setShowFromSuggestions(false);
  //     return;
  //   }

  //   const timer = setTimeout(async () => {
  //     const suggestions = await fetchFlightCitySuggestions(fromQuery);
  //     setFromSuggestions(suggestions);
  //     setShowFromSuggestions(true);
  //   }, 300);

  //   return () => clearTimeout(timer);
  // }, [fromQuery]);

  // useEffect(() => {
  //   if (!toQuery.trim()) {
  //     setToSuggestions([]);
  //     setShowToSuggestions(false);
  //     return;
  //   }

  //   const timer = setTimeout(async () => {
  //     const suggestions = await fetchFlightCitySuggestions(toQuery);
  //     setToSuggestions(suggestions);
  //     setShowToSuggestions(true);
  //   }, 300);

  //   return () => clearTimeout(timer);
  // }, [toQuery]);

  const handleTravellClass = () => {};

  const getIataCode = (selectedItem, queryValue) => {
    if (selectedItem?.iataCode) return selectedItem.iataCode;
    const cleaned = queryValue?.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(cleaned) ? cleaned : "";
  };

  console.log("Check Flight Com");

  return (
    <>
      <div className="relative lg:pb-40">
        <CommonHeader title="Flight" value={true} />
        <div className="absolute md:top-6 lg:top-20 left-1/2  -translate-x-1/2 w-[100%] lg:w-[100%]">
          <CommonFlightHotelSearchBox
            selectedFrom={selectedFrom}
            formatSuggestion={formatSuggestion}
            setSelectedFrom={setSelectedFrom}
            selectedTo={selectedTo}
            setSelectedTo={setSelectedTo}
            travellers={travellers}
            setTravellers={setTravellers}
            setSelectedClass={setSelectedClass}
            selectedClass={selectedClass}
            selectedFare={selectedFare}
            setSelectedFare={setSelectedFare}
          />
        </div>
      </div>
    </>
  );
};

export default FlightSearch;

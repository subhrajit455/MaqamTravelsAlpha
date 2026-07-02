import React, { useEffect, useState } from "react";
import { ChevronDown,  } from "lucide-react";
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

        <div>     
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border border-gray-200 rounded-lg w-2/3 mx-auto m-4 overflow-hidden">
        {/* From */}
        <div className="p-4 cursor-pointer hover:bg-gray-50 transition">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</p>
          <p className="text-2xl font-bold text-gray-900">Delhi</p>
          <p className="text-sm text-gray-600">DEL, Indira Gandhi International Airport</p>
        </div>
        
        {/* To */}
        <div className="p-4 border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">To</p>
          <p className="text-2xl font-bold text-gray-900">Bengaluru</p>
          <p className="text-sm text-gray-600">BLR, Kempegowda International Airport</p>
        </div>
        
        {/* Departure */}
        <div className="p-4 border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Departure</p>
            <ChevronDown className="w-4 h-4 text-[#2276E3]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">2 Jul 26</p>
          <p className="text-sm text-gray-600">Monday</p>
        </div>
        
        {/* Return */}
        <div className="p-4 border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Return</p>
            <ChevronDown className="w-4 h-4 text-[#2276E3]" />
          </div>
          <p className="text-lg font-medium text-gray-400">Tap to add date</p>
        </div>
        
        {/* Travellers & Class */}
        <div className="p-4 border-l border-gray-200 cursor-pointer hover:bg-gray-50 transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Travellers & Class</p>
            <ChevronDown className="w-4 h-4 text-[#2276E3]" />
          </div>
          <p className="text-lg font-medium text-gray-900">1 Traveller</p>
          <p className="text-sm text-gray-600">Economy</p>
        </div>
        </div>
        </div>

    </>
  );
};

export default FlightSearch;

import { useState,useEffect } from "react";
import {
  ChevronDown,
  Contact,
  ArrowLeft,
  ArrowRight,
  Plane,
} from "lucide-react";

const ArrivalPlace = ({
  toSuggestions,
  showToSuggestions,
  setToQuery,
  formatSuggestion,
  selectedTo,
  setSelectedTo,
  setToSuggestions,
  setShowToSuggestions,
  setIsDisabled
}) => {
  const handleSelectTo = (suggestion) => {
  setToQuery(formatSuggestion(suggestion));
  setSelectedTo(suggestion);
  setToSuggestions([]);
  setShowToSuggestions(false);

  localStorage.setItem(
    "selectedTo",
    JSON.stringify(suggestion)
  );
};

useEffect(() => {
  // const savedFrom = JSON.parse(localStorage.getItem("selectedFrom"));
  const savedTo = JSON.parse(localStorage.getItem("selectedTo"));

 

  if (savedTo) {
    setSelectedTo(savedTo);
    setToQuery(formatSuggestion(savedTo));
  }
}, []);

  return (
    <>
      <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl  z-50 max-h-72 overflow-y-auto">
        {toSuggestions?.map((airport) => (
          <button
            key={airport.id || airport.iataCode}
            onClick={() => handleSelectTo(airport)}
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
              <p className="font-bold text-lg px-2">{airport.iataCode}</p>
              <p className="text-xs text-gray-400">
                {airport.address?.countryCode}
              </p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

export default ArrivalPlace;

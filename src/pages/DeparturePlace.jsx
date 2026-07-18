import { useState } from "react";
import {
  ChevronDown,
  Contact,
  ArrowLeft,
  ArrowRight,
  Plane,
} from "lucide-react";

const DeparturePlace = ({
  fromSuggestions,
  showFromSuggestions,
  setFromQuery,
  formatSuggestion,
  selectedFrom,
  setSelectedFrom,
  setFromSuggestions,
  setShowFromSuggestions,
}) => {
  const handleSelectFrom = (suggestion) => {
    console.log("Selected From suggestion:", suggestion);
    setFromQuery(formatSuggestion(suggestion));
    setSelectedFrom(suggestion);
    setFromSuggestions([]);
    setShowFromSuggestions(false);
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

  return (
    <>
      <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl  z-[100] max-h-72 overflow-y-auto">
        {fromSuggestions?.map((airport) => (
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
    </>
  );
};

export default DeparturePlace;

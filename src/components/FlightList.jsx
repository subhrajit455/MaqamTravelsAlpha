import React from "react";
import {
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Luggage,
  CheckCircle,
} from "lucide-react";

const FlightCard = ({ flight, handlePriceConfirmation, isLoadingFlights }) => {
  const segment = flight?.itineraries?.[0]?.segments?.[0];
  const price = flight?.price?.grandTotal;

  const depTime = new Date(segment?.departure?.at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const arrTime = new Date(segment?.arrival?.at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 border">
      {/* TOP SECTION */}
      <div className="flex justify-between items-center">
        {/* Airline */}
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {segment?.carrierCode} {segment?.number}
          </h3>
          <p className="text-sm text-gray-500">
            Aircraft: {segment?.aircraft?.code}
          </p>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">₹{price}</p>
          <p className="text-xs text-gray-500">per traveller</p>
        </div>
      </div>

      {/* FLIGHT TIMELINE */}
      <div className="flex items-center justify-between mt-6">
        {/* Departure */}
        <div className="text-center">
          <p className="text-xl font-semibold">{depTime}</p>
          <p className="text-gray-500">{segment?.departure?.iataCode}</p>
        </div>

        {/* Middle */}
        <div className="flex-1 px-4">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Clock size={14} />
            {segment?.duration}
          </div>

          <div className="border-t border-dashed mt-2 relative">
            <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-2 text-xs text-gray-400">
              Non-stop
            </span>
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center">
          <p className="text-xl font-semibold">{arrTime}</p>
          <p className="text-gray-500">{segment?.arrival?.iataCode}</p>
        </div>
      </div>

      {/* EXTRA INFO */}
      <div className="flex flex-wrap justify-between items-center mt-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <PlaneTakeoff size={16} />
          {segment?.departure?.iataCode} Terminal{" "}
          {segment?.departure?.terminal || "-"}
        </div>

        <div className="flex items-center gap-2">
          <PlaneLanding size={16} />
          {segment?.arrival?.iataCode} Terminal{" "}
          {segment?.arrival?.terminal || "-"}
        </div>

        <div className="flex items-center gap-2">
          <Luggage size={16} />
          {
            flight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]
              ?.includedCheckedBags?.weight
          }{" "}
          KG
        </div>
      </div>

      {/* AMENITIES */}
      <div className="mt-5 flex flex-wrap gap-2">
        {flight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.amenities
          ?.slice(0, 3)
          .map((item, i) => (
            <span
              key={i}
              className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full flex items-center gap-1"
            >
              <CheckCircle size={12} />
              {item.description}
            </span>
          ))}
      </div>

      {isLoadingFlights ? (
        <div className="mt-6 flex justify-end">
          <button
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold cursor-not-allowed"
            disabled
          >
            Book Flight....
          </button>
        </div>
      ) : (
        <div className="mt-6 flex justify-end">
          <button
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold cursor-pointer"
            onClick={() => handlePriceConfirmation(flight)}
          >
            Book Flight
          </button>
        </div>
      )}

      {/* BUTTON */}
    </div>
  );
};

export default FlightCard;

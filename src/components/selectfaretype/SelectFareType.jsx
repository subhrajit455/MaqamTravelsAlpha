import React from "react";

const SelectFareType = ({ setSelectedFare, fareTypes, selectedFare }) => {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-700 whitespace-nowrap">
          SELECT A FARE TYPE
        </h3>
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 flex-1">
          {fareTypes.map((fare) => (
            <label
              key={fare}
              className={`flex items-center justify-center gap-2 px-2 py-2 rounded-lg border cursor-pointer transition-all duration-300 ${
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

              <span className="text-sm font-medium whitespace-nowrap">
                {fare}
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
};

export default SelectFareType;

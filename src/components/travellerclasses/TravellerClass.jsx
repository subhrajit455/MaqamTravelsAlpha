import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  Contact,
  ArrowLeft,
  ArrowRight,
  Plane,
} from "lucide-react";
const TravellerClass = ({
  setSelectedClass,
  travellers,
  setTravellers,
  selectedClass,
}) => {
  return (
    <>
      <div className="border-l h-full border-gray-200">
        <div
          className="p-4 h-full border-gray-200 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setSelectedClass(true)}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Travellers & Class
            </p>
            <ChevronDown className="w-4 h-4 text-[#2276E3]" />
          </div>
          <p className="text-lg font-medium text-gray-900">
            {travellers.adult + travellers.child + travellers.infant} Traveller
            {travellers.adult + travellers.child + travellers.infant > 1
              ? "s"
              : ""}
          </p>
          <p className="text-sm text-gray-600">{travellers.travelClass}</p>
        </div>

        <div class="relative w-full sm:w-72">
          {/* <!-- Dropdown --> */}
          {selectedClass && (
            <div class="absolute right-0 top-full w-72  bg-white border border-gray-300 rounded-md  p-4 z-50">
              {/* <!-- Adult --> */}
              <div class="flex items-center justify-between mb-3">
                <label class="text-gray-700 font-medium">Adult (12+)</label>
                <select
                  value={travellers.adult}
                  onChange={(e) =>
                    setTravellers((prev) => ({
                      ...prev,
                      adult: Number(e.target.value),
                    }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* <!-- Child --> */}
              <div class="flex items-center justify-between mb-3">
                <label class="text-gray-700 font-medium">Child (2-11)</label>
                <select
                  value={travellers.child}
                  onChange={(e) =>
                    setTravellers((prev) => ({
                      ...prev,
                      child: Number(e.target.value),
                    }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                >
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* <!-- Infant --> */}
              <div class="flex items-center justify-between mb-3">
                <label class="text-gray-700 font-medium">Infant (0-2)</label>
                <select
                  value={travellers.infant}
                  onChange={(e) =>
                    setTravellers((prev) => ({
                      ...prev,
                      infant: Number(e.target.value),
                    }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                >
                  {[0, 1, 2].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* <!-- Class --> */}
              <div class="flex items-center justify-between mb-4">
                <label class="text-gray-700 font-medium">Class</label>
                <select
                  className="border rounded-md px-3 py-2"
                  value={travellers.travelClass}
                  onChange={(e) =>
                    setTravellers({
                      ...travellers,
                      travelClass: e.target.value,
                    })
                  }
                >
                  <option>Economy</option>
                  <option>Premium Economy</option>
                  <option>Business</option>
                  <option>First Class</option>
                </select>
              </div>

              {/* <!-- Button --> */}
              <div class="text-right">
                <button
                  onClick={() => setSelectedClass(false)}
                  class="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-full"
                >
                  DONE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TravellerClass;

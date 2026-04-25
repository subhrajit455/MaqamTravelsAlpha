import React from "react";
import { MapPin, Clock, Utensils, Bus } from "lucide-react";

const Tag = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px]">
    <Icon size={14} />
    {text}
  </div>
);

const PackageCard = ({ pkg }) => {
  return (
    <>
      <div className="bg-[#d9f3f2] border border-teal-300 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 p-3 ">
          {/* Image */}
          <img
            src={pkg.image}
            alt="place"
            className="w-full md:w-30 h-28 object-cover rounded-lg"
          />

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                {pkg.title}
              </h2>
              <p className="text-sm text-teal-600">{pkg.duration}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                <Tag icon={Bus} text="Pick Up & Drop" />
                <Tag icon={Clock} text="Stay" />
                <Tag icon={Utensils} text="Food" />
                <Tag icon={MapPin} text="Sight Seen" />
              </div>

              {/* Price */}
              <p className="mt-3 font-semibold text-gray-900">
                {pkg.price} <span className="text-sm font-normal">/Person</span>
              </p>

             
            </div>
          </div>

          {/* Button */}
          <div className="flex items-end justify-end md:justify-center">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-5 py-2 rounded-lg">
              Check Out
            </button>
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mx-2 my-2 text-xs text-gray-700 ">
            <p>• Guided Umrah assistance </p>
            <p>• Halal meals & modest hotel rooms</p>
            <p>• Masjid al-Haram & Masjid an-Nabawi visits</p>
            <p>• Private group transfers</p>
          </div>
      </div>
     
    </>
  );
};
export default PackageCard;

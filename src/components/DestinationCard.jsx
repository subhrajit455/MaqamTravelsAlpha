import { Star } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const DestinationCard = ({ item }) => {
  const navigation = useNavigate();
  return (
    <div className="min-w-[260px] bg-[#f8f6ef] border border-yellow-300 rounded-xl p-3 justify-between flex flex-col cursor-pointer" onClick={()=>navigation(`/details/${item.id}`)}>
      
      {/* Image */}
      <img
        src={item.thumbnail}
        alt={item.name}
        className="w-full h-32 object-cover rounded-lg"
      />

      {/* Content */}
      <div className="mt-2">
        {/* Hotel Name */}
        <h2 className="font-semibold text-gray-800 text-sm">
          {item.name}
        </h2>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <Star className="text-yellow-500" size={20} fill="currentColor" />
          <span className="text-base font-semibold text-gray-700">
            {item.rating}
          </span>
          <span className="text-base font-medium text-gray-500 ">
            ({item.reviewCount} reviews)
          </span>
        </div>

        {/* Location */}
        <p className="text-base text-gray-500 mt-1 font-medium">
          {item.city}, {item.country}
        </p>

        {/* Button */}
        <NavLink to={`/details/${item.id}`}>
        <button className="cursor-pointer mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold py-1.5 rounded-md">
          Book Your Day
        </button>
        </NavLink>
      </div>
    </div>
  );
};

export default DestinationCard;
import { useNavigate } from "react-router-dom";
import { Star, Clock, MapPin, ArrowRight, Heart } from "lucide-react";

const DestinationCard = ({ item, variant = "default" }) => {
  // console.log("DestinationCard item=======", item);

  const navigation = useNavigate();

  const detailId = item?.id || item?._id || item?.hotelId || item?.slug;
  const cardTitle =
    item?.title || item?.name || item?.hotelName || "Destination";
  const cardSubtitle =
    item?.duration || item?.stay || item?.durationText || "Flexible itinerary";
  const cardPrice =
    item?.price ||
    item?.priceRange ||
    item?.startingPrice ||
    item?.amount ||
    "Contact us";
  const cardLocation = item?.location || item?.city || item?.country || "";
  const cardImage =
    item?.image ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.photo ||
    item?.main_photo ||
    item?.mainPhoto ||
    "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=800";

  const handleViewDetails = (event) => {
    event?.stopPropagation();
    if (detailId) {
      navigation(`/details/${detailId}`);
    }
  };

  // Default variant - compact card with slanted price bar
  if (variant === "default") {
    return (
      <div
        className="min-w-[280px] max-w-[290px] bg-white rounded-3xl flex flex-col justify-between cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 relative group"
        onClick={handleViewDetails}
      >
        {/* Image with zoom effect & rating overlay */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={cardImage}
            alt={cardTitle}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          {/* Rating Pill overlay on image */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm text-[11px] font-bold text-gray-800">
            <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
            <span>4.8</span>
          </div>

          {/* Heart icon for premium touch */}
          <button
            className="absolute top-3 right-3 bg-white/85 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart size={14} className="text-gray-400 hover:text-red-500 transition" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h2 className="text-[#00aa6c] text-[15px] font-bold line-clamp-2 leading-snug hover:text-[#008f5a] transition">
              {cardTitle}
            </h2>

            {/* Details (Duration & Location) */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <Clock size={13} className="text-teal-600" />
                <span className="font-medium">{cardSubtitle}</span>
              </div>

              {cardLocation && (
                <div className="flex items-center gap-2 text-gray-600 text-xs">
                  <MapPin size={13} className="text-teal-600" />
                  <span className="font-medium">{cardLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Price & Book Now */}
        <div className="flex w-full bg-[#00aa6c] h-12 overflow-hidden items-stretch border-t border-gray-100">
          {/* Left Side: Price badge with slanted edge */}
          <div
            className="bg-[#e0f2fe] pl-4 pr-6 flex flex-col justify-center flex-1 h-full select-none"
            style={{ clipPath: "polygon(0 0, 85% 0, 100% 100%, 0 100%)" }}
          >
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider leading-none">
              Starting From
            </span>
            <span className="text-[14px] font-bold text-gray-900 leading-none mt-1">
              {cardPrice}
            </span>
          </div>

          {/* Right Side: Book Now Button */}
          <div className="w-[42%] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 flex items-center justify-center font-bold text-white text-xs gap-1 h-full transition duration-300">
            <span>BOOK NOW</span>
            <ArrowRight size={12} className="stroke-[3] transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // List variant - cleaner design for hotel lists
  if (variant === "list") {
    return (
      <div
        className="min-w-[280px] max-w-[320px] bg-white rounded-xl flex flex-col cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-200"
        onClick={handleViewDetails}
      >
        {/* Image with heart icon */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={cardImage}
            alt={cardTitle}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
          />
          <button
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition"
            onClick={(e) => {
              e.stopPropagation();
              // Add to favorites logic here
            }}
          >
            <Heart
              size={16}
              className="text-gray-400 hover:text-red-500 transition"
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-gray-800 text-[16px] font-bold line-clamp-2 leading-snug mb-2">
            {cardTitle}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={12} fill="currentColor" stroke="none" />
              <Star size={12} fill="currentColor" stroke="none" />
              <Star size={12} fill="currentColor" stroke="none" />
              <Star size={12} fill="currentColor" stroke="none" />
              <Star size={12} className="text-gray-300" />
            </div>
            <span className="text-xs text-gray-500">(4.0)</span>
          </div>

          {/* Details */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-xs">
              <Clock size={13} className="text-teal-600" />
              <span>{cardSubtitle}</span>
            </div>
            {cardLocation && (
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <MapPin size={13} className="text-teal-600" />
                <span>{cardLocation}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                From
              </span>
              <div className="text-lg font-bold text-teal-700">{cardPrice}</div>
            </div>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-teal-700 transition">
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DestinationCard;

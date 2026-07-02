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
        className="min-w-[260px] max-w-[280px] bg-white rounded-2xl flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-lg transition delay-150 duration-300 ease-in-out hover:scale-105 overflow-hidden border border-gray-100/80"
        onClick={handleViewDetails}
      >
        {/* Image */}
        <img
          src={cardImage}
          alt={cardTitle}
          className="w-full h-44 object-cover"
        />

        {/* Content Container */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h2 className="text-[#00aa6c] text-[16px] font-bold line-clamp-2 leading-snug">
              {cardTitle}
            </h2>

            {/* Star Rating */}
            <div className="flex items-center gap-0.5 mt-1 text-amber-400">
              <Star size={13} fill="currentColor" stroke="none" />
              <Star size={13} fill="currentColor" stroke="none" />
              <Star size={13} fill="currentColor" stroke="none" />
              <Star size={13} fill="currentColor" stroke="none" />
              <Star size={13} fill="currentColor" stroke="none" />
            </div>

            {/* Details (Duration & Location) */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <Clock size={14} className="text-gray-400" />
                <span className="font-medium">{cardSubtitle}</span>
              </div>

              {cardLocation && (
                <div className="flex items-center gap-2 text-gray-600 text-xs">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="font-medium">{cardLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Price & Book Now */}
        <div className="flex w-full bg-[#009689] h-12 overflow-hidden items-stretch">
          {/* Left Side: Price badge with slanted edge */}
          <div
            className="bg-[#e0f2fe] pl-4 pr-6 flex flex-col justify-center flex-1 h-full select-none"
            style={{ clipPath: "polygon(0 0, 85% 0, 100% 100%, 0 100%)" }}
          >
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider leading-none">
              Starting From
            </span>
            <span className="text-[15px] font-bold text-gray-900 leading-none mt-1">
              {cardPrice}
            </span>
          </div>

          {/* Right Side: Book Now Button */}
          <div className="w-[45%] flex items-center justify-center font-bold text-white text-xs gap-1 h-full">
            <span>BOOK NOW</span>
            <ArrowRight size={13} className="stroke-[3]" />
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

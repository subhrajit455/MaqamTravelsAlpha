import { useLocation ,useNavigate} from "react-router-dom";
import { Star, MapPin, ChevronRight, ChevronLeft, X, ZoomIn , ChevronDown, BadgeCheck, Sparkle} from "lucide-react";
import { useState } from "react";
import Modal from "../components/Modal";
import CommonHeader from "../components/CommonHeader";
import ScrollToTop from "../components/ScrollToTop";

import image01 from "../assets/image01.jpg";
import image02 from "../assets/image02.jpg";
import image03 from "../assets/image03.jpg";
import image04 from "../assets/image04.jpg";
import image05 from "../assets/image05.jpg";

const HotelBookingDetails = () => {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const item = location?.state?.item;
  console.log("HotelBookingDetails item", item);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const hotelImages = [
    { src: image01, alt: "Hotel Main", label: "Swimming Pool" },
    { src: image02, alt: "Room", label: "Room(21)" },
    { src: image03, alt: "Pool", label: "Swimming Pool(5)" },
    { src: image04, alt: "Hotel 4", label: "Hotel View" },
    { src: image05, alt: "Hotel 5", label: "Beach View" },
  ];

  const hotelName = item?.name || item?.title || item?.hotelName || "Beira Mar Beach Resorts";
  const hotelLocation = item?.location || item?.city || item?.country || "Benaulim, Goa";
  const rating = item?.rating || "4.4";
  const reviews = item?.reviews || 120;
  const price = item?.price || "₹3,606";
  const taxes = item?.taxes || "+360 taxes & fees";


  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? hotelImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === hotelImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
  };

 
  const handleNavigateToSelectedRoomInformation = () => {
    navigate("/selected-room-information");
  }



  return (
    <>
    <CommonHeader title="Hotel" />
    <div className="max-w-7xl mx-auto px-4 py-6 font-poppins">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{hotelName}</h1>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin size={16} className="text-teal-600" />
              <span className="text-sm">{hotelLocation}</span>
            </div>
            <p className="text-sm text-gray-500">2 minutes walk to Benaulim Beach</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              View Map
            </button>
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded">
            <Star size={14} fill="white" />
            <span className="font-bold">{rating}/5</span>
          </div>
          <span className="text-sm text-gray-600">Very Good</span>
          <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">
            {reviews} Reviews
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 h-[400px]">
            {/* Main Image */}
            <div className="flex-2 relative rounded-xl overflow-hidden group cursor-pointer flex-[2]" onClick={handleZoomToggle}>
              <img
                src={hotelImages[currentImageIndex].src}
                alt={hotelImages[currentImageIndex].alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x600?text=No+Image+Available";
                }}
              />
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                Property Photos ({hotelImages.length})
              </div>
              <button 
                className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  // View all functionality
                }}
              >
                View All
              </button>
              {/* Zoom Icon */}
              <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
                <ZoomIn size={20} className="text-white" />
              </div>
              {/* Navigation Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            {/* Thumbnails Column */}
            <div className="flex-1 flex flex-col gap-2 flex-[1]">
              {/* Thumbnail 1 */}
              <div 
                className="flex-1 relative rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition border-2 border-transparent hover:border-teal-500"
                onClick={() => handleThumbnailClick(1)}
              >
                <img
                  src={hotelImages[1].src}
                  alt="Thumbnail 1"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {hotelImages[1].label}
                </div>
              </div>
              {/* Thumbnail 2 */}
              <div 
                className="flex-1 relative rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition border-2 border-transparent hover:border-teal-500"
                onClick={() => handleThumbnailClick(2)}
              >
                <img
                  src={hotelImages[2].src}
                  alt="Thumbnail 2"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {hotelImages[2].label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm sticky top-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Premium Cottage with Balcony
              </h3>
              <p className="text-sm text-gray-600">2 Guests | 1 Room</p>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{price}</span>
                <span className="text-sm text-gray-500">Per Night</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{taxes}</p>
            </div>

            <button className="w-full bg-[#00BBA7] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#00BBA7] transition mb-4 cursor-pointer">
              VIEW 2 ROOM OPTIONS
            </button>

            {/* Offers Section */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Offers</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    PROMO
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Use GOHSBCEMI Code
                    </p>
                    <p className="text-xs text-gray-600">
                      Get ₹ 309 off. Pay using HSBC Bank Credit Cards EMI to avail...
                    </p>
                    <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                      +2 more offers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={handleZoomToggle}>
          <button 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
            onClick={handleZoomToggle}
          >
            <X size={32} className="text-white" />
          </button>
          <img
            src={hotelImages[currentImageIndex].src}
            alt={hotelImages[currentImageIndex].alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}

     <div className="grid grid-cols-3 gap-4 bg-[#D1E5FF] p-4 rounded-xl mt-6">
            <div className="font-semibold border-r border-white h-full pr-4">Room Type</div>
            <div className="font-semibold border-r border-white h-full pr-4">Room Options</div>
            <div className="font-semibold">Price Details</div>
     </div>

      {/* Room Details */}
        <div className="grid grid-cols-3 grid-rows-2 gap-4 bg-white p-4 rounded-xl mt-2 shadow-sm">

          {/* Left Side - Room Details */}
          <div className="row-span-2 border-r border-gray-300 pr-4">
            <div>
              <h4 className="font-bold text-gray-900">Premium Suites</h4>
              <p className="text-xs text-gray-500">2 Guests | 1 Room</p>
            </div>

            <img
              src={image01}
              alt="Room"
              className="w-full h-48 object-cover rounded-lg mt-3"
            />

           <p onClick={() => setModalOpen(true)} className="flex justify-between items-center text-sm text-gray-500 mt-3 cursor-pointer hover:text-teal-600 transition">
              View More Details <ChevronRight size={16} />
            </p>
          </div>

          {/* First Room Option */}
          <div className="flex items-center border-r border-gray-300 pr-4 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Room with Breakfast</p>
              <p className="text-xs text-green-600 font-medium">Non-Refundable</p>
            </div>
          </div>

          {/* First Price */}
          <div className="flex items-center border-b border-gray-200">
            <div>
              <div className="flex justify-center">
                    <p className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    50% OFF
                  </p>
               </div>

              <div className="flex flex-col justify-center items-center w-full">
                 <p className="text-lg font-bold text-gray-900">₹12,500</p>
                 <p className="text-[#778CA3] text-sm">Per Neight</p>
                 <button onClick={()=>handleNavigateToSelectedRoomInformation()} className="bg-[#00BBA7] text-white font-semibold px-2 py-1 rounded text-xs hover:bg-[#00BBA7] transition mt-2 w-1/2 text-center cursor-pointer truncate w-full">SELECT ROOM</button>
                 <p className="text-xs text-gray-500">Includes taxes & fees</p>
              </div>

            </div>
          </div>

          {/* Second Room Option */}
          <div className="flex items-center border-r border-gray-300 pr-4">
            <div>
              <p className="font-medium text-gray-900">Room Only</p>
              <p className="text-xs text-green-600 font-medium">
                Free Cancellation
              </p>
            </div>
          </div>

          {/* Second Price */}
          <div className="flex items-center">
            <div>
              
               <div className="flex justify-center">
                    <p className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    50% OFF
                  </p>
               </div>
              
               <div className="flex flex-col justify-center items-center w-full">
                 <p className="text-lg font-bold text-gray-900">₹10,800</p>
                 <p className="text-[#778CA3] text-sm">Per Neight</p>
                  <button className="bg-[#00BBA7] text-white font-semibold px-2 py-1 rounded text-xs hover:bg-[#00BBA7] transition mt-2 w-1/2 text-center cursor-pointer truncate w-full">SELECT ROOM</button>
                 <p className="text-xs text-gray-500">Includes taxes & fees</p>
               </div>
            </div>
          </div>

        </div>
   <Modal  isModalOpen={isModalOpen} setModalOpen={setModalOpen}/>
    </div>
    <ScrollToTop />
    </>
  );
};

export default HotelBookingDetails;
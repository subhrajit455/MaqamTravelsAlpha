import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { HotelDetailsAPI } from "../configs/api";
import {
  Star,
  MapPin,
  Wifi,
  Phone,
  CalendarClock,
  Clock,
  Hotel,
  PhoneCall,
  Locate,
  Sparkles,
  Shield,
  CreditCard,
  CheckCircle,
  Coffee,
  Utensils,
  Dumbbell,
  Car,
  Waves,
  Wind,
  Tv,
  Snowflake,
  Briefcase,
  Users,
  Gift,
  Heart,
  Share2,
  Maximize2,
  Image,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  Ruler,
  Bed,
  Wine,
  WifiIcon,
  Thermometer,
  TvIcon,
  CoffeeIcon,
  Microwave,
  ShowerHead,
  Key,
  Bath,
  UtensilsCrossed,
  DoorOpen,
  Sparkle,
  Plus,
  Calendar,
  Eye,
} from "lucide-react";
import { MdOutlineMarkEmailRead } from "react-icons/md";
import { WiGaleWarning } from "react-icons/wi";
import HotelFacilities from "../components/HotelFacilities";
import HotelPolicies from "../components/HotelPolicies";
import CommonHeader from "../components/CommonHeader";
import HotelRoomAvailability from "../components/HotelRoomAvailability";
import { toast } from "react-toastify";
import { BiFridge } from "react-icons/bi";
import Room from "../components/Room";
import HotelRoomsListing from "../components/HotelRoomsListing";
import ScrollToTop from "../components/ScrollToTop";

const HotelDetails = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openhotelRoomAvailability, setOpenHotelRoomAvailability] =
    useState(false);
  const [expandedSections, setExpandedSections] = useState({
    about: false,
    facilities: false,
    policies: false,
    information: false,
  });
  const [rateComponentData, setRateComponentData] = useState(null);
  const [reservationData, setReservationData] = useState({
    hotelIds: [id],
    occupancies: [
      {
        adults: 2,
      },
    ],
    guestNationality: "IN",
    currency: "INR",
    checkin: "",
    checkout: "",
    roomMapping: true,
    maxRatesPerHotel: 5,
  });

  useEffect(() => {
    // Set default dates (today and 3 days later)
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    setReservationData((prev) => ({
      ...prev,
      checkin: today.toISOString().split("T")[0],
      checkout: threeDaysLater.toISOString().split("T")[0],
    }));
  }, [id]);

  const handleReservationInputChange = (field, value) => {
    setReservationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOccupancyChange = (field, value) => {
    setReservationData((prev) => ({
      ...prev,
      occupancies: [
        {
          ...prev.occupancies[0],
          [field]: Math.max(0, value),
        },
      ],
    }));
  };
  const thumbnailsRef = useRef(null);
  const fallbackImage =
    "https://placehold.co/800x600/2dd4bf/ffffff?text=No+Image+Available";

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const endpoint = HotelDetailsAPI?.HotelDetailsApi
          ? `${HotelDetailsAPI.HotelDetailsApi}?hotelId=${id}`
          : "https://jsonplaceholder.typicode.com/users";

        const res = await fetch(endpoint);
        const result = await res.json();

        const hotelData = Array.isArray(result)
          ? result[0]
          : result?.data?.data?.[0] || result?.data || result;

        const normalizeImage = (image) => {
          if (!image) return null;
          if (typeof image === "string") return { url: image };
          if (typeof image === "object") {
            const url = image.url || image.image || image.src || image.photo;
            return url ? { ...image, url } : null;
          }
          return null;
        };

        const imageList = [
          ...(Array.isArray(hotelData?.hotelImages)
            ? hotelData.hotelImages
            : []),
          ...(Array.isArray(hotelData?.images) ? hotelData.images : []),
          ...(Array.isArray(hotelData?.photos) ? hotelData.photos : []),
        ]
          .map(normalizeImage)
          .filter(Boolean);

        const normalizedHotel = {
          ...hotelData,
          main_photo:
            hotelData?.main_photo ||
            hotelData?.mainPhoto ||
            hotelData?.photo ||
            hotelData?.image ||
            imageList[0]?.url ||
            fallbackImage,
          hotelImages: imageList,
        };

        setHotel(normalizedHotel);
      } catch (error) {
        console.error(error);
        setHotel({
          name: "Hotel Details",
          main_photo: fallbackImage,
          hotelImages: [{ url: fallbackImage }],
        });
      }
    };

    if (id) fetchHotelDetails();
  }, [id]);

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const dummyHotelImages = [
    {
      url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    },
    {
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const allImages = [
    {
      url: hotel?.main_photo || fallbackImage,
      isMain: true,
      alt: hotel?.name || "Hotel image",
    },
    ...dummyHotelImages
      .map((img) => ({
        ...img,
        url: img?.url || img?.image || img?.src || img?.photo || fallbackImage,
        isMain: false,
      }))
      .filter((img) => img?.url),
  ];

  const openImageModal = (imageUrl, index) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
    setCurrentSlideIndex(index);
  };

  const facilityIcons = {
    WiFi: Wifi,
    Parking: Car,
    Restaurant: Utensils,
    Bar: Coffee,
    Pool: Waves,
    Gym: Dumbbell,
    Spa: Sparkles,
    "Air Conditioning": Wind,
    TV: Tv,
    "Room Service": Briefcase,
    "Family Rooms": Users,
    "Pet Friendly": Heart,
    Breakfast: Coffee,
    "Free Parking": Car,
    Heating: Snowflake,
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % allImages.length);
    setSelectedImage(allImages[(currentSlideIndex + 1) % allImages.length].url);
  };

  const prevSlide = () => {
    setCurrentSlideIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length,
    );
    setSelectedImage(
      allImages[(currentSlideIndex - 1 + allImages.length) % allImages.length]
        .url,
    );
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailsRef.current) {
      const scrollAmount = 120;
      thumbnailsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getFacilityIcon = (facilityName) => {
    const Icon = facilityIcons[facilityName] || CheckCircle;
    return Icon;
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmitReservation = async () => {
    console.log("Reservation Data:", reservationData);
    setIsLoading(true);
    // Here you would make your API call
    try {
      const response = await fetch(HotelDetailsAPI.HotelRoomAvailabilityApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();
      // Handle success/error
      console.log("Reservation Response:", result);
      if (result.success) {
        setIsLoading(false);
        toast.success(result.message || "Reservation request sent");
        setIsReservationModalOpen(false);
        setOpenHotelRoomAvailability(true);
        setRateComponentData(result.data[0]);
      } else {
        setIsLoading(false);
        toast.error(result.message || "Failed to make reservation");
        setOpenHotelRoomAvailability(false);
      }
    } catch (error) {
      console.error("Error making reservation:", error.message);
      toast.error(
        "Error making reservation. Please try again." || error.message,
      );
      setIsLoading(false);
    }
  };

  const getBedIcon = (bedType) => {
    if (bedType?.toLowerCase().includes("king"))
      return <Crown size={14} className="text-amber-500" />;
    if (bedType?.toLowerCase().includes("queen"))
      return <Crown size={14} className="text-amber-500" />;
    if (bedType?.toLowerCase().includes("double")) return <Bed size={14} />;
    return <Bed size={14} />;
  };
  const getAmenityIcon = (amenityName) => {
    const iconMap = {
      Minibar: Wine,
      WiFi: WifiIcon,
      "Air Conditioning": Thermometer,
      TV: TvIcon,
      "Coffee machine": CoffeeIcon,
      Microwave: Microwave,
      Refrigerator: BiFridge,
      Hairdryer: ShowerHead,
      Slippers: Key,
      "Private bathroom": Bath,
      Shower: ShowerHead,
      "Satellite channels": TvIcon,
      Kitchenette: UtensilsCrossed,
      "Private entrance": DoorOpen,
    };
    const Icon = iconMap[amenityName] || Sparkle;
    return <Icon size={14} />;
  };

  const handleSubmitPreorder = async (id) => {
    console.log("Data:", id);
    setIsLoading(true);
    // Here you would make your API call
    try {
      const response = await fetch(HotelDetailsAPI.HotelRoomPreorderApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerId: id,
        }),
      });

      const result = await response.json();
      // Handle success/error
      console.log("Reservation Response:", result);
      if (result.success) {
        setIsLoading(false);
        toast.success(result.message || "Reservation request sent");
        setIsReservationModalOpen(false);
        setOpenHotelRoomAvailability(false);
        setRateComponentData(result.data[0]);
      } else {
        setIsLoading(false);
        toast.error(result.message || "Failed to make reservation");
        setOpenHotelRoomAvailability(true);
      }
    } catch (error) {
      console.error("Error making reservation:", error.message);
      toast.error("Error making reservation. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <CommonHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-poppins">
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                className="cursor-pointer absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition z-10"
                onClick={() => setIsImageModalOpen(false)}
              >
                <X size={24} />
              </button>

              {/* Navigation Buttons */}
              <button
                className="cursor-pointer absolute left-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition z-10"
                onClick={prevSlide}
              >
                <ChevronLeft size={32} />
              </button>

              <button
                className="cursor-pointer absolute right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition z-10"
                onClick={nextSlide}
              >
                <ChevronRight size={32} />
              </button>

              {/* Main Image */}
              <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
                <img
                  src={selectedImage}
                  alt={`Slide ${currentSlideIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                {currentSlideIndex + 1} / {allImages.length}
              </div>

              {/* Thumbnails */}
              <div className="absolute bottom-17 left-0 right-0 px-4">
                <div className="relative">
                  <button
                    className="cursor-pointer absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition"
                    onClick={() => scrollThumbnails("left")}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div
                    ref={thumbnailsRef}
                    className="overflow-x-auto scrollbar-hide px-8"
                  >
                    <div className="flex justify-center gap-2">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentSlideIndex(idx);
                            setSelectedImage(img.url);
                          }}
                          className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-x-hidden border-2 transition ${
                            currentSlideIndex === idx
                              ? "border-teal-500"
                              : "border-white "
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition cursor-pointer"
                    onClick={() => scrollThumbnails("right")}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section with Images */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6">
            {/* Left Spacer (Desktop Only) */}
            <div className="hidden md:block md:col-span-1 md:order-1"></div>

            {/* Main Image */}
            <div className="md:col-span-6 md:order-2 md:translate-x-16">
              <div className="relative group w-full">
                <img
                  src={hotel.main_photo}
                  className="w-full h-[500px] object-cover rounded-2xl shadow-lg cursor-pointer"
                  onClick={() => openImageModal(hotel.main_photo, 0)}
                />

                <button
                  className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center gap-2 cursor-pointer"
                  onClick={() => openImageModal(hotel.main_photo, 0)}
                >
                  <Maximize2 size={16} />
                  View Full Size
                </button>

                {allImages.length > 0 && (
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                    <Image size={14} />
                    <span>{allImages.length} photos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              <div className="grid grid-cols-3 gap-2 mt-2">
                {allImages.slice(1, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative group cursor-pointer h-[100px]"
                  >
                    <img
                      src={img.url}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                      onClick={() => openImageModal(img.url, i + 1)}
                    />
                    {i === 2 && allImages.length > 4 && (
                      <div
                        className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex flex-col items-center justify-center"
                        onClick={() => setShowAllImages(true)}
                      >
                        <span className="text-white text-sm font-bold">
                          +{allImages.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {showAllImages && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-xl font-bold">All Photos</h3>
                    <button
                      className="text-white bg-black bg-opacity-50 rounded-full p-2 cursor-pointer"
                      onClick={() => setShowAllImages(false)}
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allImages.map((img, i) => (
                      <div key={i} className="cursor-pointer">
                        <img
                          src={img.url}
                          className="w-full h-48 object-cover rounded-lg"
                          onClick={() => {
                            openImageModal(img.url, i);
                            setShowAllImages(false);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Images */}
            <div className="hidden md:block md:col-span-2 md:order-3">
              {!showAllImages ? (
                <div className="grid grid-cols-1 gap-2 md:translate-x-16">
                  {allImages.slice(1, 5).map((img, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer h-[120px]"
                    >
                      <img
                        src={img.url}
                        className="w-3/4 h-full object-cover rounded-xl shadow-md"
                        onClick={() => openImageModal(img.url, i + 1)}
                      />
                      {i === 3 && allImages.length > 5 && (
                        <div
                          className="absolute inset-0 bg-black bg-opacity-60 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-opacity-70 transition"
                          onClick={() => setShowAllImages(true)}
                        >
                          <span className="text-white text-2xl font-bold">
                            +{allImages.length - 5}
                          </span>
                          <span className="text-white text-sm">Show all</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 h-full overflow-y-auto max-h-[420px]">
                  {allImages.slice(1).map((img, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer h-[205px]"
                    >
                      <img
                        src={img.url}
                        className="w-full h-full object-cover rounded-xl shadow-md"
                        onClick={() => openImageModal(img.url, i + 1)}
                      />
                    </div>
                  ))}
                  <button
                    className="col-span-2 mt-2 bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition flex items-center justify-center gap-2"
                    onClick={() => setShowAllImages(false)}
                  >
                    Show Less
                  </button>
                </div>
              )}
            </div>

            {/* Hotel Price Details */}
            <div className="md:col-span-3 md:order-4">
              <div className="bg-white w-full rounded-2xl shadow-xl border border-gray-100 p-6 transition-all hover:shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Starting from</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-extrabold text-teal-600">
                        {hotel.price || "₹5,499"}
                      </span>
                      <span className="text-gray-500 text-sm">/ night</span>
                    </div>
                  </div>
                  <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Best Rate
                  </div>
                </div>

                <div className="space-y-3 border-t border-b border-gray-100 py-4 my-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock size={16} className="text-teal-500" /> Standard Room Rate
                    </span>
                    <span className="font-semibold text-gray-800">{hotel.price || "₹5,499"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Shield size={16} className="text-teal-500" /> Taxes & Fees (Included)
                    </span>
                    <span className="text-green-600 font-semibold">Free</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl mt-2">
                    <CheckCircle size={14} />
                    <span>Free cancellation before check-in</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsReservationModalOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} />
                  Book Now / Reserve
                </button>
              </div>
            </div>


          </div>

          {/* Show All Images Button for Desktop */}
          {!showAllImages && allImages.length > 5 && (
            <div className="absolute bottom-8 right-8 hidden md:block">
              <button
                className="bg-white shadow-lg hover:shadow-xl text-gray-700 px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 cursor-pointer"
                onClick={() => setShowAllImages(true)}
              >
                <Image size={18} />
                Show all {allImages.length} photos
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-8 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {hotel.hotelType || "Hotel"}
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => {
                      const starValue = hotel.rating / 2;

                      return (
                        <Star
                          key={i}
                          size={18}
                          className={`${
                            i < Math.floor(starValue)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      );
                    })}
                    <div className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1.5 rounded-xl shadow-md">
                      <Star size={16} fill="white" />
                      <span className="font-bold">{hotel.rating}</span>
                      <span className="text-xs opacity-90">/10</span>
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
                  {hotel.name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="text-teal-500" size={25} />
                    <span>
                      {hotel.address}, {hotel.city}, {hotel.country},{" "}
                      {hotel.zip}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <PhoneCall className="text-teal-500" size={18} />
                    <span>{hotel.phone || "Not Available"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdOutlineMarkEmailRead
                      className="text-teal-500"
                      size={18}
                    />
                    <span>
                      {hotel?.email ? hotel.email : "Email Not Available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarClock className="text-teal-500" size={18} />
                    <span>
                      Check-in: {hotel?.checkinCheckoutTimes?.checkin_start} -{" "}
                      {hotel?.checkinCheckoutTimes?.checkin_end}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="text-teal-500" size={18} />
                    <span>
                      Checkout: {hotel?.checkinCheckoutTimes?.checkout}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:text-right">
                <button
                  onClick={() => setIsReservationModalOpen(true)}
                  className="cursor-pointer mt-3 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold rounded-md"
                >
                  Reserve Room
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <button
              type="button"
              onClick={() => toggleSection("about")}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-teal-500" />
                About this hotel
              </h2>
              <span className="text-2xl font-semibold text-teal-600">
                {expandedSections.about ? "−" : "+"}
              </span>
            </button>
            {expandedSections.about && (
              <div>
                <p>
                  Book from a wide range of hotels in Makkah and Madinah—from
                  budget-friendly accommodations to luxury hotels near the Holy
                  Mosques. Filter by distance, amenities, ratings, and price to
                  find your perfect stay.
                </p>
              </div>
            )}
          </div>

          {/* Facilities Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <button
              type="button"
              onClick={() => toggleSection("facilities")}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Gift className="text-teal-500" />
                Facilities & Amenities
              </h2>
              <span className="text-2xl font-semibold text-teal-600">
                {expandedSections.facilities ? "−" : "+"}
              </span>
            </button>
            {expandedSections.facilities && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <p>hhhhhhhhhhhhhhhhhh</p>
                {hotel.hotelFacilities?.map((fac, index) => {
                  const Icon = getFacilityIcon(fac);
                  return (
                    <HotelFacilities
                      key={index}
                      index={index}
                      Icon={Icon}
                      fac={fac}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Policies Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <button
              type="button"
              onClick={() => toggleSection("policies")}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="text-teal-500" />
                Hotel Policies
              </h2>
              <span className="text-2xl font-semibold text-teal-600">
                {expandedSections.policies ? "−" : "+"}
              </span>
            </button>
            {expandedSections.policies && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotel.policies?.map((policy, index) => (
                  <HotelPolicies
                    key={index}
                    policy={policy}
                    Icon={WiGaleWarning}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Important Information Section */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6">
            <button
              type="button"
              onClick={() => toggleSection("information")}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="text-teal-500" />
                Important Information
              </h2>
              <span className="text-2xl font-semibold text-teal-600">
                {expandedSections.information ? "−" : "+"}
              </span>
            </button>
            {expandedSections.information && (
              <div
                className="mt-4 text-gray-700 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: hotel.hotelImportantInformation,
                }}
              />
            )}
          </div>

          {/* Map Section (Optional) */}
          {/* {hotel.location.latitude && hotel.location.longitude && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-teal-500" />
                Location Map
              </h2>
              <div className="h-64 bg-gray-200 rounded-xl overflow-hidden">
                <iframe
                  title="Hotel Location"
                  className="w-full h-full"
                  frameBorder="0"
                  src={`https://maps.google.com/maps?q=${hotel.location.latitude},${hotel.location.longitude}&z=15&output=embed`}
                />
              </div>
            </div>
          )} */}
        </div>
      </div>
      <HotelRoomAvailability
        isReservationModalOpen={isReservationModalOpen}
        setIsReservationModalOpen={setIsReservationModalOpen}
        hotelId={id}
        hotelName={hotel.name}
        reservationData={reservationData}
        setReservationData={setReservationData}
        handleSubmitReservation={handleSubmitReservation}
        handleReservationInputChange={handleReservationInputChange}
        handleOccupancyChange={handleOccupancyChange}
        isLoading={isLoading}
      />

      <Room
        hotel={hotel}
        getBedIcon={getBedIcon}
        getAmenityIcon={getAmenityIcon}
        openImageModal={openImageModal}
      />

      {openhotelRoomAvailability && (
        <HotelRoomsListing
          rateComponentData={rateComponentData}
          reservationData={reservationData}
          onClose={() => setOpenHotelRoomAvailability(false)}
          handleSubmitPreorder={handleSubmitPreorder}
          isLoading={isLoading}
        />
      )}
      <ScrollToTop />
    </>
  );
};

export default HotelDetails;

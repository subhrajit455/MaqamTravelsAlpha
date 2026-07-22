import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoLogoWhatsapp } from "react-icons/io";
import Loginimage from "../assets/login.jpg";
import { MdPhone } from "react-icons/md";
import Namaj from "../assets/namaj.png";
import Light from "../assets/light.gif";
import { MdVerified } from "react-icons/md";
import { PiBowlFoodFill } from "react-icons/pi";
import { FaEarthAmericas } from "react-icons/fa6";
import { RiStarSmileFill } from "react-icons/ri";
import { Search, User, X, ArrowLeft, Phone, Eye } from "lucide-react";
import image from "../assets/image.png";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ShoppingBag, Sun } from "lucide-react";
import { GiIndianPalace } from "react-icons/gi";
import { BsMoonStarsFill } from "react-icons/bs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BsForkKnife } from "react-icons/bs";
import { FaUmbrellaBeach } from "react-icons/fa6";
// import HotelCard from "../components/HotelCard";
import DestinationCard from "../components/DestinationCard";
import Heroimage1 from "../assets/heroimage.jpg";
import Heroimage2 from "../assets/Madina wallpaper hd.jpg";
import Heroimage3 from "../assets/madinah.jpg";
import Logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { SearchAPI } from "../configs/api";
import Login from "../components/Login";
import VerificatinOtp from "../components/VerificationOtp";
import ForgetPasswordPopModal from "../components/ForgetPasswordPopModal";
import { BiSolidUpArrow } from "react-icons/bi";
import Register from "../components/Register";
import Forget from "../components/Forget";
import ScrollToTop from "../components/ScrollToTop";
import { toast } from "react-toastify";
import { UserAPI } from "../configs/api";
import { forgotPassword } from "../components/reducer/AuthSlice";
import Flight from "./Flight";
const Home = () => {
  const dispatch = useDispatch();
  const navigator = useNavigate();
  const scrollRef = useRef();
  const scrollRef2 = useRef();
  const [hotelJed, setHotelJed] = useState(null);
  const [hotelMed, setHotelMed] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(
    sessionStorage.getItem("loginPopupShown"),
  );
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [showForgetPopup, setShowForgetPopup] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [confirmpasswordchange, setConfirmpasswordchange] = useState(false);
  const [reset_Token, setReset_Token] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showconfirmPassword, setShowconfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [register, setRegister] = useState({
    title: "Mr",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    password: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loginedUser, setLoginUser] = useState({
    mobilenumber: "",
    password: "",
  });

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (direction === "left") {
      current.scrollBy({ left: -300, behavior: "smooth" });
    } else {
      current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
  const scroll2 = (direction) => {
    const { current } = scrollRef2;
    if (direction === "left") {
      current.scrollBy({ left: -300, behavior: "smooth" });
    } else {
      current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const cards = [
    {
      image: "https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb",
      title: "Hajj Pilgrimage Services",
      description:
        "Experience a fulfilling Hajj journey with expert guidance and tailored travel solutions.",
    },
    {
      image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa",
      title: "Umrah Pilgrimage Services",
      description:
        "Join us for a spiritually enriching Umrah experience with personalized arrangements.",
    },
    {
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      title: "Travel Packages Available",
      description:
        "Explore exciting travel packages for unforgettable destinations around the world.",
    },
    {
      image: "https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb",
      title: "Hajj Pilgrimage Services",
      description:
        "Experience a fulfilling Hajj journey with expert guidance and tailored travel solutions.",
    },
    {
      image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa",
      title: "Umrah Pilgrimage Services",
      description:
        "Join us for a spiritually enriching Umrah experience with personalized arrangements.",
    },
    {
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      title: "Travel Packages Available",
      description:
        "Explore exciting travel packages for unforgettable destinations around the world.",
    },
  ];

  const fallbackMakkahHotels = [
    {
      id: "m1",
      name: "Fairmont Makkah Clock Royal Tower",
      title: "Fairmont Makkah Clock Royal Tower",
      location: "Makkah (Near Masjid al-Haram)",
      city: "Makkah",
      stay: "5-Star Luxury",
      duration: "Walking distance to Haram",
      price: "Rs. 18,500/night",
      startingPrice: "Rs. 18,500/night",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800",
    },
    {
      id: "m2",
      name: "Pullman ZamZam Makkah",
      title: "Pullman ZamZam Makkah",
      location: "Abraj Al Bait, Makkah",
      city: "Makkah",
      stay: "5-Star Premium",
      duration: "Direct access to Haram complex",
      price: "Rs. 14,200/night",
      startingPrice: "Rs. 14,200/night",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800",
    },
    {
      id: "m3",
      name: "Swissôtel Makkah",
      title: "Swissôtel Makkah",
      location: "Ajyad Street, Makkah",
      city: "Makkah",
      stay: "5-Star Comfort",
      duration: "Spacious family suites",
      price: "Rs. 15,800/night",
      startingPrice: "Rs. 15,800/night",
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800",
    },
    {
      id: "m4",
      name: "Hilton Suites Makkah",
      title: "Hilton Suites Makkah",
      location: "Jabal Omar, Makkah",
      city: "Makkah",
      stay: "5-Star Modern",
      duration: "Overlooking Masjid al-Haram",
      price: "Rs. 16,900/night",
      startingPrice: "Rs. 16,900/night",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800",
    },
    {
      id: "m1",
      name: "Fairmont Makkah Clock Royal Tower",
      title: "Fairmont Makkah Clock Royal Tower",
      location: "Makkah (Near Masjid al-Haram)",
      city: "Makkah",
      stay: "5-Star Luxury",
      duration: "Walking distance to Haram",
      price: "Rs. 18,500/night",
      startingPrice: "Rs. 18,500/night",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800",
    },
    {
      id: "m2",
      name: "Pullman ZamZam Makkah",
      title: "Pullman ZamZam Makkah",
      location: "Abraj Al Bait, Makkah",
      city: "Makkah",
      stay: "5-Star Premium",
      duration: "Direct access to Haram complex",
      price: "Rs. 14,200/night",
      startingPrice: "Rs. 14,200/night",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800",
    },
    {
      id: "m3",
      name: "Swissôtel Makkah",
      title: "Swissôtel Makkah",
      location: "Ajyad Street, Makkah",
      city: "Makkah",
      stay: "5-Star Comfort",
      duration: "Spacious family suites",
      price: "Rs. 15,800/night",
      startingPrice: "Rs. 15,800/night",
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800",
    },
    {
      id: "m4",
      name: "Hilton Suites Makkah",
      title: "Hilton Suites Makkah",
      location: "Jabal Omar, Makkah",
      city: "Makkah",
      stay: "5-Star Modern",
      duration: "Overlooking Masjid al-Haram",
      price: "Rs. 16,900/night",
      startingPrice: "Rs. 16,900/night",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800",
    },
  ];

  const fallbackMadinahHotels = [
    {
      id: "med1",
      name: "Anwar Al Madinah Mövenpick",
      title: "Anwar Al Madinah Mövenpick",
      location: "Madinah (Close to Prophet's Mosque)",
      city: "Madinah",
      stay: "5-Star Premium",
      duration: "Directly facing Haram courtyard",
      price: "Rs. 12,500/night",
      startingPrice: "Rs. 12,500/night",
      image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=800",
    },
    {
      id: "med2",
      name: "Pullman ZamZam Madinah",
      title: "Pullman ZamZam Madinah",
      location: "Central Northern Area, Madinah",
      city: "Madinah",
      stay: "5-Star Luxury",
      duration: "Steps away from Bab Al Salam",
      price: "Rs. 11,800/night",
      startingPrice: "Rs. 11,800/night",
      image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800",
    },
    {
      id: "med3",
      name: "Madinah Hilton",
      title: "Madinah Hilton",
      location: "King Fahd Street, Madinah",
      city: "Madinah",
      stay: "5-Star Classic",
      duration: "Few minutes walk to Prophet's Mosque",
      price: "Rs. 13,000/night",
      startingPrice: "Rs. 13,000/night",
      image: "https://images.unsplash.com/photo-1611891487122-2075b9624448?q=80&w=800",
    },
    {
      id: "med4",
      name: "Dar Al Taqwa Hotel Madinah",
      title: "Dar Al Taqwa Hotel Madinah",
      location: "Off Courtyard of Prophet's Mosque",
      city: "Madinah",
      stay: "5-Star Luxury",
      duration: "Prime VIP location",
      price: "Rs. 17,200/night",
      startingPrice: "Rs. 17,200/night",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800",
    },
    {
      id: "m1",
      name: "Fairmont Makkah Clock Royal Tower",
      title: "Fairmont Makkah Clock Royal Tower",
      location: "Makkah (Near Masjid al-Haram)",
      city: "Makkah",
      stay: "5-Star Luxury",
      duration: "Walking distance to Haram",
      price: "Rs. 18,500/night",
      startingPrice: "Rs. 18,500/night",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800",
    },
    {
      id: "m2",
      name: "Pullman ZamZam Makkah",
      title: "Pullman ZamZam Makkah",
      location: "Abraj Al Bait, Makkah",
      city: "Makkah",
      stay: "5-Star Premium",
      duration: "Direct access to Haram complex",
      price: "Rs. 14,200/night",
      startingPrice: "Rs. 14,200/night",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800",
    },
    {
      id: "m3",
      name: "Swissôtel Makkah",
      title: "Swissôtel Makkah",
      location: "Ajyad Street, Makkah",
      city: "Makkah",
      stay: "5-Star Comfort",
      duration: "Spacious family suites",
      price: "Rs. 15,800/night",
      startingPrice: "Rs. 15,800/night",
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800",
    },
    {
      id: "m4",
      name: "Hilton Suites Makkah",
      title: "Hilton Suites Makkah",
      location: "Jabal Omar, Makkah",
      city: "Makkah",
      stay: "5-Star Modern",
      duration: "Overlooking Masjid al-Haram",
      price: "Rs. 16,900/night",
      startingPrice: "Rs. 16,900/night",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800",
    },
    
  ];

  const items = [
    {
      icon: GiIndianPalace,
      title: "Historic Mosques & Heritage",
      desc: "Visit iconic mosques, Islamic museums, and sacred sites.",
    },
    {
      icon: FaUmbrellaBeach,
      title: "Halal Food Trails",
      desc: "Explore certified halal restaurants, traditional markets, and food streets.",
    },
    {
      icon: BsForkKnife,
      title: "Modesty-Friendly Beaches",
      desc: "Private access, family zones, and respectful environments.",
    },
    {
      icon: ShoppingBag,
      title: "Souqs & Local Art",
      desc: "Shop Islamic décor, abayas, prayer mats, attars, Turkish lamps, etc.",
    },
    {
      icon: BsMoonStarsFill,
      title: "Spiritual Routes",
      desc: "Umrah preparation support, meditation retreats, guided reflections.",
    },
    {
      icon: Sun,
      title: "Culture with Comfort",
      desc: "Enjoy cultural tours curated with Muslim safety and values in mind.",
    },
  ];
  const features = [
    {
      name: "Verified Stay",
      icon: MdVerified,
    },
    {
      name: "Healthy Food",
      icon: PiBowlFoodFill,
    },
    {
      name: "Safe Location",
      icon: RiStarSmileFill,
    },
    {
      name: "Curated Destinations",
      icon: FaEarthAmericas,
    },
  ];

  const packages = Array.from({ length: 18 }, (_, index) => ({
    id: index + 1,
    title: "Istanbul, Turkey",
    location: "Turkey",
    duration: "3 Days & 2 Nights",
    price: "Rs. 15000 - 20000/-",
    image:
      "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=800",
  }));

  const fetchHotelDetailsJED = async () => {
    try {
      const res = await fetch(
        `${SearchAPI.SearchApi}?iataCode=JED&limit=9&page=1`,
      );
      const result = await res.json();
      console.log(result);
      setHotelJed(result?.data);
      console.log(result?.data?.data);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchHotelDetailsMED = async () => {
    try {
      const res = await fetch(
        `${SearchAPI.SearchApi}?iataCode=MED&limit=9&page=1`,
      );
      const result = await res.json();
      console.log(result);
      setHotelMed(result?.data);
      console.log(result?.data?.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchHotelDetailsJED();
    fetchHotelDetailsMED();
  }, []);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const current = scrollRef.current;
        if (
          current.scrollLeft + current.clientWidth >=
          current.scrollWidth - 10
        ) {
          current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          current.scrollBy({ left: 300, behavior: "smooth" });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleregister = async () => {
    console.log("Register data:", register);
    // Validate required fields
    // if (
    //   !register.name ||
    //   !register.email ||
    //   !register.password ||
    //   !register.phone
    // ) {
    //   toast.error("Please fill in all required fields");
    //   return;
    // }

    // setIsLoading(true);
    // try {
    //   // Create FormData to handle file upload
    //   const formData = new FormData();
    //   formData.append("title", register.title);
    //   formData.append("name", register.name);
    //   formData.append("email", register.email);
    //   formData.append("password", register.password);
    //   formData.append("phone", register.phone);

    //   // Append profile image if exists
    //   if (profileImage) {
    //     formData.append("profileImage", profileImage);
    //   }

    //   console.log("FormData entries:");
    //   for (const [key, value] of formData.entries()) {
    //     console.log(key, value);
    //   }
    //   // Submit registration
    //   const response = await fetch(`${UserAPI.UserRegisterApi}`, {
    //     method: "POST",
    //     body: formData,
    //   });

    //   const result = await response.json();

    //   if (result.success) {
    //     console.log("Registration successful:", result);
    //     toast.success("Registration successful!" || result.message);
    //     // Reset form
    //     setRegister({
    //       title: "Mr",
    //       name: "",
    //       email: "",
    //       phone: "",
    //       password: "",
    //     });
    //     setProfileImage(null);
    //     // Close register popup
    //     setShowRegisterPopup(false);
    //   } else {
    //     toast.error(result.message || "Registration failed");
    //     console.error("Registration error:", result);
    //   }
    // } catch (error) {
    //   console.error("Registration error:", error);
    //   toast.error("An error occurred during registration");
    // } finally {
    //   setIsLoading(false);
    // }

    // dispatch(registerUser({ register, profileImage }))
  };

  const handleLogin = async () => {
    console.log("Login data:", loginedUser);

    // Validate required fields
    if (!loginedUser.mobilenumber || !loginedUser.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    navigator("/");
    setShowLoginPopup(true);
    toast.success("Login successful!");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // if (email) {
    //   setIsLoading(true);
    //   try {
    //     const payload = { email };
    //     const response = await fetch(UserAPI.UserForgetPasswordApi, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(payload),
    //     });
    //     const result = await response.json();
    //     if (result.success) {
    //       toast.success("Reset link sent to your email!" || result.message);
    //       setSubmitted(true);
    //       setEmail("");
    //       setIsLoading(false);
    //     } else {
    //       toast.error(
    //         "Failed to send reset link. Please try again." || result.message,
    //       );
    //       setIsLoading(false);
    //     }
    //   } catch (error) {
    //     toast.error("An error occurred. Please try again." || error.message);
    //     setIsLoading(false);
    //   }
    // }
  };

  const heroSlides = [
    { src: Heroimage1, alt: "Maqam hero background" },
    { src: Heroimage2, alt: "Maqam hero background 2" },
    { src: Heroimage3, alt: "Maqam hero background 3" },
  ];

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [heroSlides.length]);

  const makkahList = (Array.isArray(hotelJed) && hotelJed.length > 0) ? hotelJed : fallbackMakkahHotels;
  const madinahList = (Array.isArray(hotelMed) && hotelMed.length > 0) ? hotelMed : fallbackMadinahHotels;

  return (
    <>
      <Flight />
      <section className="bg-[#FAFAF8] py-16 pt-36 pb-16 px-6 font-poppins border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-teal-600 font-semibold text-xs uppercase tracking-wider">Top Pilgrimage Stays</span>
              <h2 className="text-3xl font-bold text-gray-950 mt-1">
                Recommended Destination Makkah
              </h2>
            </div>
            <p className="text-gray-500 text-sm max-w-md hidden md:block">
              Highly rated hotels near Masjid al-Haram, verified for comfort, premium amenities, and spiritual proximity.
            </p>
          </div>

          {/* Wrapper */}
          <div className="flex items-center gap-4">
            {/* Left Arrow */}
            <button
              onClick={() => scroll("left")}
              className="bg-white hover:bg-teal-600 text-teal-700 hover:text-white p-3 rounded-full shadow-md hover:shadow-lg border border-gray-100 cursor-pointer transition-all duration-300 relative z-40 active:scale-95 flex items-center justify-center animate-fade-in"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>

            {/* Scrollable Cards */}
            <div
              ref={scrollRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-2 flex-1"
            >
              {makkahList.map((item, index) => (
                <DestinationCard key={index} item={item} />
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll("right")}
              className="bg-white hover:bg-teal-600 text-teal-700 hover:text-white p-3 rounded-full shadow-md hover:shadow-lg border border-gray-100 cursor-pointer transition-all duration-300 relative z-40 active:scale-95 flex items-center justify-center animate-fade-in"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#F9FAFB] py-16 px-6 font-poppins">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-teal-600 font-semibold text-xs uppercase tracking-wider">Peaceful & Sacred Retreats</span>
              <h2 className="text-3xl font-bold text-gray-950 mt-1">
                Recommended Destination Madinah
              </h2>
            </div>
            <p className="text-gray-500 text-sm max-w-md hidden md:block">
              Enjoy peaceful visits to the Prophet's Mosque with handpicked, close-proximity hotel selections.
            </p>
          </div>

          {/* Wrapper */}
          <div className="flex items-center gap-4">
            {/* Left Arrow */}
            <button
              onClick={() => {
                scroll2("left");
              }}
              className="bg-white hover:bg-teal-600 text-teal-700 hover:text-white p-3 rounded-full shadow-md hover:shadow-lg border border-gray-100 cursor-pointer transition-all duration-300 relative z-40 active:scale-95 flex items-center justify-center"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>

            {/* Scrollable Cards */}
            <div
              ref={scrollRef2}
              className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-2 flex-1"
            >
              {madinahList.map((item, index) => (
                <DestinationCard key={index} item={item} />
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll2("right")}
              className="bg-white hover:bg-teal-600 text-teal-700 hover:text-white p-3 rounded-full shadow-md hover:shadow-lg border border-gray-100 cursor-pointer transition-all duration-300 relative z-40 active:scale-95 flex items-center justify-center"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>

      {/* <section className="bg-[#F3F4F6] py-14 px-6 font-poppins">
        <div className="max-w-7xl mx-auto">
          
          <h2 className="text-2xl font-medium text-gray-900 mb-8">
            Recommended Hotel
          </h2>

         
          <div className="grid md:grid-cols-3 gap-4">
            {hotels.map((hotel, index) => (
              <HotelCard key={index} hotel={hotel} />
            ))}
          </div>
        </div>
      </section> */}

      <section className="bg-[#FAFAF8] py-14 px-6 font-poppins">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-medium text-gray-900 mb-8">
            Recommended Packages
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 justify-center items-center">
            {cards.map((pkg, index) => (
              <DestinationCard key={index} item={pkg} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-14 px-6 font-poppins">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h2 className="text-2xl font-medium text-gray-900 mb-8">
            Experience Travel Through Islamic Values
          </h2>

          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-teal-50 border border-teal-400 rounded-xl p-5"
                >
                  <div className="bg-yellow-200 p-2 rounded-md border border-yellow-400">
                    <Icon size={28} className="text-yellow-700" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-700 mt-1">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#FAFAF8] py-16 px-6 font-poppins">
        <div className="max-w-7xl mx-auto grid  md:grid-cols-[1fr_400px] gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-2xl font-medium text-gray-900 mb-8">
              About Us
            </h2>

            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Korem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu
              turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus
              nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum
              tellus elit sed risus.
            </p>

            <p className="text-gray-700 text-sm leading-relaxed">
              Class aptent taciti sociosqu ad litora torquent per conubia
              nostra, per inceptos himenaeos. Praesent auctor purus luctus enim
              egestas, ac scelerisque ante pulvinar.
            </p>

            {/* Why Choose */}
            <h3 className="mt-8 font-semibold text-gray-900">Why Choose Us</h3>

            <div className="flex flex-wrap gap-4 mt-4">
              {features.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <Icon size={18} />
                    {item.name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Images */}
          <div className=" flex justify-center">
            {/* Back Image */}
            <img
              src={image}
              alt="Decorative background"
              className=" w-[360px]"
            />
          </div>
        </div>
      </section>

      {!showLoginPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white  shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto max-h-[90vh] overflow-auto">
            <button
              onClick={() => {
                setShowLoginPopup(true);
                sessionStorage.setItem("loginPopupShown", "true");
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-700 z-10 bg-red-200 p-1 rounded-full cursor-pointer"
              aria-label="Close login modal"
            >
              <X size={15} />
            </button>
            <Login
              setSubmitted={setSubmitted}
              isLoading={isLoading}
              setShowLoginPopup={setShowLoginPopup}
              setShowRegisterPopup={setShowRegisterPopup}
              setShowForgetPopup={setShowForgetPopup}
              setShowPassword={setShowPassword}
              showPassword={showPassword}
              setLoginUser={setLoginUser}
              loginedUser={loginedUser}
              handleLogin={handleLogin}
            />
          </div>
        </div>
      )}
      {showRegisterPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white  shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto max-h-[90vh] overflow-auto">
            <button
              onClick={() => {
                setShowRegisterPopup(false);
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-700 z-10 bg-red-200 p-1 rounded-full cursor-pointer"
              aria-label="Close register modal"
            >
              <X size={15} />
            </button>
            <Register
              isLoading={isLoading}
              setShowLoginPopup={setShowLoginPopup}
              setShowRegisterPopup={setShowRegisterPopup}
              setShowForgetPopup={setShowForgetPopup}
              register={register}
              setRegister={setRegister}
              profileImage={profileImage}
              setProfileImage={setProfileImage}
              handleregister={handleregister}
            />
          </div>
        </div>
      )}
      {showForgetPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white  shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto max-h-[90vh] overflow-auto">
            <button
              onClick={() => {
                setShowForgetPopup(false);
                setShowLoginPopup(true);
                setShowVerificationPopup(false);
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-700 z-10 bg-red-200 p-1 rounded-full cursor-pointer"
              aria-label="Close forget modal"
            >
              <X size={15} />
            </button>
            <Forget
              handleSubmit={handleSubmit}
              email={email}
              setEmail={setEmail}
              submitted={submitted}
              setSubmitted={setSubmitted}
              isLoading={isLoading}
              setShowLoginPopup={setShowLoginPopup}
              setShowRegisterPopup={setShowRegisterPopup}
              setShowForgetPopup={setShowForgetPopup}
              setShowVerificationPopup={setShowVerificationPopup}
              setReset_Token={setReset_Token}
            />
          </div>
        </div>
      )}

      {showVerificationPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white  shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto max-h-[90vh] overflow-auto">
            <button
              onClick={() => {
                setShowVerificationPopup(false);
                setShowForgetPopup(false);
                setShowLoginPopup(true);

                sessionStorage.setItem("loginPopupShown", "true");
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-700 z-10 bg-red-200 p-1 rounded-full cursor-pointer"
              aria-label="Close login modal"
            >
              <X size={15} />
            </button>
            <VerificatinOtp
              handleSubmit={handleSubmit}
              email={email}
              setEmail={setEmail}
              submitted={submitted}
              setSubmitted={setSubmitted}
              isLoading={isLoading}
              setShowLoginPopup={setShowLoginPopup}
              setShowRegisterPopup={setShowRegisterPopup}
              setShowForgetPopup={setShowForgetPopup}
              setShowVerificationPopup={setShowVerificationPopup}
              reset_Token={reset_Token}
              setReset_Token={setReset_Token}
              setConfirmpasswordchange={setConfirmpasswordchange}
            />
          </div>
        </div>
      )}

      {confirmpasswordchange && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white  shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto max-h-[90vh] overflow-auto">
            <button
              onClick={() => {
                setShowVerificationPopup(false);
                setShowForgetPopup(false);
                setShowLoginPopup(true);
                setConfirmpasswordchange(false);
                sessionStorage.setItem("loginPopupShown", "true");
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-700 z-10 bg-red-200 p-1 rounded-full cursor-pointer"
              aria-label="Close login modal"
            >
              <X size={15} />
            </button>
            <ForgetPasswordPopModal
              handleSubmit={handleSubmit}
              email={email}
              setEmail={setEmail}
              submitted={submitted}
              setSubmitted={setSubmitted}
              isLoading={isLoading}
              setShowLoginPopup={setShowLoginPopup}
              setShowRegisterPopup={setShowRegisterPopup}
              setShowForgetPopup={setShowForgetPopup}
              setShowVerificationPopup={setShowVerificationPopup}
              reset_Token={reset_Token}
              setReset_Token={setReset_Token}
              setConfirmpasswordchange={setConfirmpasswordchange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showconfirmPassword={showconfirmPassword}
              setShowconfirmPassword={setShowconfirmPassword}
            />
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </>
  );
};

export default Home;

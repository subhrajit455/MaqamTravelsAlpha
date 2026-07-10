import React, { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { BiSolidUpArrow } from "react-icons/bi";
import { FaRobot } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { GoHomeFill } from "react-icons/go";
import { IoLocationSharp } from "react-icons/io5";
import { RiHotelFill } from "react-icons/ri";
import { BiSolidPlaneAlt } from "react-icons/bi";
import Logo from "../assets/logo.png";
import HeroBg from "../assets/heroimage.jpg";
import image01 from "../assets/image01.jpg";
import image02 from "../assets/image02.jpg";
import image03 from "../assets/image03.jpg";
import image04 from "../assets/image04.jpg";
import image05 from "../assets/image05.jpg";

const heroImages = [image01, image03, image04];

const CommonHeader = ({ title }) => {
  const navigator = useNavigate();
  const [open, setOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileUserDropdown, setShowMobileUserDropdown] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [current, setCurrent] = useState(0);

  const menu = [
    { name: "Home", icon: GoHomeFill, href: "/" },
    // { name: "Location", icon: IoLocationSharp, href: "/location" },
    { name: "Hotel", icon: RiHotelFill, href: "/hotel" },
    { name: "Flight", icon: BiSolidPlaneAlt, href: "/flight" },
    // { name: "Ai Tour Planner", icon: FaRobot, href: "/ai-tour-planner" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative h-[460px] bg-cover bg-center flex flex-col items-center font-poppins"
      // style={{ backgroundImage: `url(${heroImages[currentImage]})` }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{
            width: `${heroImages.length * 100}%`,
            transform: `translateX(-${current * (100 / heroImages.length)}%)`,
          }}
        >
          {heroImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-full h-full object-cover"
            />
          ))}
        </div>

        {/* <div className="absolute inset-0 bg-black/40" /> */}
      </div>
      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-black/40"></div> */}

      {/* Navbar */}
      <div className="relative z-10 w-[95%] sm:w-[92%] md:w-[90%] lg:w-[100%] mt-4 sm:mt-6 px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between  gap-2">
        {/* Logo */}
        <NavLink to="/">
          <img
            src={Logo}
            alt="logo"
            className="h-6 sm:h-7 md:h-8 w-48 xm:h-64 object-contain"
          />
        </NavLink>

        {/* Desktop Menu */}
        {/* <div className="hidden md:flex items-center gap-8 lg:gap-12">
          {menu.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-base font-medium ${
                    isActive
                      ? "text-emerald-600 font-bold"
                      : "text-gray-500 hover:text-emerald-700"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div> */}

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* User Dropdown */}
          <div
            className="hidden md:block relative"
            onMouseEnter={() => setShowUserDropdown(true)}
            onMouseLeave={() => setShowUserDropdown(false)}
          >
            <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm cursor-pointer hover:bg-teal-700 transition-colors">
              <User size={16} />
              User
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute -right-20 top-full mt-2 bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-100 py-2 w-48 z-50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white">
                  <BiSolidUpArrow size={20} />
                </div>
                <button
                  onClick={() => {
                    navigator("/login");
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium flex items-center gap-3 cursor-pointer active:bg-teal-100"
                >
                  <span className="text-base">🔐</span> <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    navigator("/register");
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium flex items-center gap-3 cursor-pointer active:bg-teal-100"
                >
                  <span className="text-base">📝</span> <span>Register</span>
                </button>
                <button
                  onClick={() => {
                    navigator("/profile");
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium flex items-center gap-3 cursor-pointer active:bg-teal-100"
                >
                  <span className="text-base">📋</span> <span>Profile</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-20 w-[92%] bg-white rounded-xl shadow-lg py-4 flex flex-col items-center gap-4 md:hidden z-20">
          {menu.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-base font-medium ${
                    isActive
                      ? "text-emerald-600"
                      : "text-gray-600 hover:text-emerald-600"
                  }`
                }
              >
                <Icon size={20} />
                {item.name}
              </NavLink>
            );
          })}

          {/* Mobile User */}
          <div className="relative">
            <div
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-teal-700 transition-colors"
              onClick={() => setShowMobileUserDropdown(!showMobileUserDropdown)}
            >
              <User size={16} />
              User
            </div>

            {/* Mobile User Dropdown */}
            {showMobileUserDropdown && (
              <div className="absolute -right-2 top-full mt-2 bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-100 py-2 w-40 z-50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white">
                  <BiSolidUpArrow size={20} />
                </div>
                <button
                  onClick={() => {
                    navigator("/login");
                    setShowMobileUserDropdown(false);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium flex items-center gap-3 cursor-pointer active:bg-teal-100"
                >
                  <span className="text-base">🔐</span> <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    navigator("/register");
                    setShowMobileUserDropdown(false);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium flex items-center gap-3 cursor-pointer active:bg-teal-100"
                >
                  <span className="text-base">📝</span> <span>Register</span>
                </button>
                <button
                  onClick={() => {
                    navigator("/profile");
                    setShowMobileUserDropdown(false);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium flex items-center gap-3 cursor-pointer active:bg-teal-100"
                >
                  <span className="text-base">📋</span> <span>Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      {/* <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold text-center">
          Choose Your Dream {title}
        </h1>
      </div> */}
    </div>
  );
};

export default CommonHeader;

import React, { useState, useEffect } from "react";
import { Menu, X, User, Briefcase, ChevronDown } from "lucide-react";
import { BiSolidUpArrow } from "react-icons/bi";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { RiHotelFill } from "react-icons/ri";
import { BiSolidPlaneAlt } from "react-icons/bi";
import Logo from "../assets/logo.png";
import image01 from "../assets/image01.jpg";
import image03 from "../assets/image03.jpg";
import image04 from "../assets/image04.jpg";

const heroImages = [image01, image03, image04];

const CommonHeader = ({ title, value }) => {
  const navigator = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileUserDropdown, setShowMobileUserDropdown] = useState(false);
  const [current, setCurrent] = useState(0);
  const [openImage, setOpenImage] = useState(value);

  // Navigation menu: Flights and Hotels only
  const menu = [
    { name: "Flights", icon: BiSolidPlaneAlt, href: "/" },
    { name: "Hotels", icon: RiHotelFill, href: "/hotel" },
  ];

  // Helper to determine if tab should be selected (including list and detail subpages)
 const isTabActive = (href) => {
  if (href === "/") {
    return (
      location.pathname === "/" ||
      location.pathname.startsWith("/flight") ||
      location.pathname.includes("fare-quote") ||
      location.pathname.includes("review") ||
      location.pathname.includes("booking")
    );
  }

  if (href === "/hotel") {
    return (
      location.pathname === "/hotel" ||
      location.pathname.startsWith("/hotel")
    );
  }
  
  return location.pathname === href;
};

  useEffect(() => {
    if (!openImage) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [openImage]);

  return (
    <div className="relative pointer-events-auto w-full font-poppins">
      {/* MakeMyTrip Style Full-Width Dark Navy Top Header Bar */}
      <header className="w-full bg-[#051329] text-white border-b border-slate-800/80 shadow-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-8 md:px-12 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo */}
          <NavLink to="/" className="flex items-center shrink-0">
            <img
              src={Logo}
              alt="logo"
              className="h-10 md:h-12 object-contain cursor-pointer"
            />
          </NavLink>

          {/* Middle: MakeMyTrip Style Category Navigation (Highlights on List & Details pages) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-3">
            {menu.map((item, index) => {
              const Icon = item.icon;
              const active = isTabActive(item.href);
              return (
                <NavLink
                  key={index}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${
                    active
                      ? "border-blue-500 text-blue-400 font-extrabold bg-blue-900/20 rounded-t-lg"
                      : "border-transparent text-gray-300 hover:text-white hover:border-gray-500"
                  }`}
                >
                  <Icon size={18} className="text-blue-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Side: My Trips & Login / Create Account Button */}
          <div className="flex items-center gap-4 shrink-0">
            {/* My Trips */}
            <div
              onClick={() => navigator("/profile")}
              className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition"
            >
              <Briefcase size={16} className="text-blue-400" />
              <span>My Trips</span>
            </div>

            {/* Desktop User Account Dropdown */}
            <div
              className="hidden md:block relative"
              onMouseEnter={() => setShowUserDropdown(true)}
              onMouseLeave={() => setShowUserDropdown(false)}
            >
              <button className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer border border-blue-400/30">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span>Login or Create Account</span>
                <ChevronDown size={14} className="text-blue-200" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 py-2 w-52 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="absolute -top-2.5 right-8 transform text-white">
                    <BiSolidUpArrow size={16} />
                  </div>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Welcome to Maqam
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator("/login");
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-600 font-semibold flex items-center gap-3 cursor-pointer"
                  >
                    <span>🔐</span> <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator("/register");
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-600 font-semibold flex items-center gap-3 cursor-pointer"
                  >
                    <span>📝</span> <span>Register</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator("/profile");
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-600 font-semibold flex items-center gap-3 cursor-pointer"
                  >
                    <span>📋</span> <span>My Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Toggle Button */}
            <button
              className="md:hidden text-gray-200 p-2 rounded-lg hover:bg-slate-800 transition"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {open && (
          <div className="md:hidden bg-[#0B1528] border-t border-slate-800 px-4 py-4 flex flex-col gap-3">
            {menu.map((item, index) => {
              const Icon = item.icon;
              const active = isTabActive(item.href);

              return (
                <NavLink
                  key={index}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold ${
                    active
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} className="text-blue-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <button
              onClick={() => {
                navigator("/profile");
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:bg-slate-800"
            >
              <Briefcase size={18} className="text-blue-400" />
              <span>My Trips</span>
            </button>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  navigator("/login");
                  setOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                <User size={16} />
                <span>Login / Register</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Image Slider (If enabled) */}
      {openImage && (
        <div className="relative w-full h-[400px] overflow-hidden">
          <div
            className="flex h-full transition-transform duration-500"
            style={{
              width: `${heroImages.length * 100}%`,
              transform: `translateX(-${current * (100 / heroImages.length)}%)`,
            }}
          >
            {heroImages.map((img, i) => (
              <div key={i} className="w-full h-full flex-shrink-0">
                <img
                  src={img}
                  alt="hero"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonHeader;

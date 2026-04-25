import React, { useState } from "react";
import { Mail, Lock, User, Phone, Image, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import Loginimage from "../assets/login.jpg";
import { NavLink } from "react-router-dom";

const Register = ({
  setShowLoginPopup,
  setShowRegisterPopup,
  isLoading,
  register,
  setRegister,
  profileImage,
  setProfileImage,
  handleregister,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="flex items-center justify-center bg-blue-100 font-poppins min-h-0">
      <div className="w-full max-w-6xl bg-white  overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">
        {/* LEFT IMAGE SECTION */}

        <div
          className="relative bg-cover bg-center hidden md:block"
          style={{
            backgroundImage: `url(${Loginimage})`,
          }}
        >
          <div className="absolute inset-0 bg-teal-900/60"></div>

          <div className=" text-white text-center absolute inset-0 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold font-dancing">MAQAM TRAVEL</h1>

            <p className="mt-2 text-sm max-w-xs font-poppins">
              Travel is the only purchase that enriches you in ways beyond
              material wealth
            </p>
          </div>
        </div>

        {/* RIGHT REGISTER SECTION */}

        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white font-poppins">
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-600 text-center">
            Welcome
          </h2>

          <p className="text-center text-gray-500 mt-2 mb-8">Register Now</p>

          <div className="mb-4 relative flex items-center">
            {/* Select Prefix */}
            <select
              value={register.title}
              onChange={(e) =>
                setRegister({ ...register, title: e.target.value })
              }
              className="absolute left-2 bg-transparent text-teal-600 outline-none text-sm cursor-pointer border-r px-1"
            >
              <option value="Mr">Mr.</option>
              <option value="Mrs">Mrs.</option>
              <option value="Ms">Mrs.</option>
              <option value="Dr">Dr.</option>
            </select>

            {/* Icon */}
            <User className="absolute left-20 text-teal-400" size={18} />

            {/* Input */}
            <input
              type="text"
              placeholder="Full Name"
              value={register.name}
              onChange={(e) =>
                setRegister({ ...register, name: e.target.value })
              }
              className="w-full pl-28 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
            />
          </div>

          {/* EMAIL */}

          <div className="mb-4 relative">
            <Mail className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type="email"
              placeholder="Email Id"
              value={register.email}
              onChange={(e) =>
                setRegister({ ...register, email: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
            />
          </div>

          {/* PASSWORD */}

          <div className="mb-4 relative">
            <Lock className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={register.password}
              onChange={(e) =>
                setRegister({ ...register, password: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-4 text-teal-400 hover:text-teal-600 cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* PHONE */}

          <div className="mb-4 relative">
            <Phone className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type="tel"
              placeholder="Phone Number"
              value={register.phone}
              onChange={(e) =>
                setRegister({ ...register, phone: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
            />
          </div>

          {/* PROFILE IMAGE */}

          <div className="mb-2 relative">
            <Image className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type="file"
              accept="image/*"
              placeholder="Profile Image"
              onChange={(e) => setProfileImage(e.target.files[0])}
              className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400 cursor-pointer"
            />
          </div>

          {/* REGISTER BUTTON */}

          {isLoading ? (
            <button className=" cursor-not-allowed w-full bg-teal-400 text-white py-3 rounded-lg font-semibold"
              disabled>
              Sign Up...
            </button>
          ) : (
            <button
              className=" cursor-pointer w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold"
              onClick={handleregister}
            >
              Sign Up
            </button>
          )}
          {/* <button className=" cursor-pointer w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold">
            Sign Up
          </button> */}

          {/* OR */}

          {/* <div className="flex items-center my-6">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
            <span className="px-4 text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div> */}

          {/* SOCIAL REGISTER */}

          {/* <div className="flex justify-center gap-4">

            <button className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
              <FcGoogle size={20} />
            </button>

            <button className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
              <FaFacebookF className="text-blue-600" />
            </button>

            <button className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
              <FaApple />
            </button>

          </div> */}

          {/* REGISTER */}

          <p className="text-center text-sm text-gray-500 mt-6">
            Do you have an account?
            <span
              className="text-teal-600 font-semibold cursor-pointer"
              onClick={() => {
                setShowLoginPopup(false);
                setShowRegisterPopup(false);
              }}
            >
              {" "}
              Sign In Now
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import Loginimage from "../assets/login.jpg";
import { NavLink } from "react-router-dom";

const Login = ({
  setShowLoginPopup,
  setShowRegisterPopup,
  setShowForgetPopup,
  setShowPassword,
  showPassword,
  setLoginUser,
  loginedUser,
  handleLogin,
  isLoading,
  setSubmitted
}) => {
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

        {/* RIGHT LOGIN SECTION */}

        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white font-poppins">
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-600 text-center">
            Welcome
          </h2>

          <p className="text-center text-gray-500 mt-2 mb-8">
            Login with Email
          </p>

          {/* EMAIL */}

          <div className="mb-4 relative">
            <Mail className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type="email"
              placeholder="Email Id"
              value={loginedUser.email}
              onChange={(e) =>
                setLoginUser({ ...loginedUser, email: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
            />
          </div>

          {/* PASSWORD */}

          <div className="mb-2 relative">
            <Lock className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={loginedUser.password}
              onChange={(e) =>
                setLoginUser({ ...loginedUser, password: e.target.value })
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

          <div
            className="text-right text-sm text-teal-500 mb-6 cursor-pointer"
            onClick={() => {
              setShowLoginPopup(false);
              setShowForgetPopup(true);
              setSubmitted(false);
            }}
          >
            Forgot your password?
          </div>

          {/* LOGIN BUTTON */}
          {isLoading ? (
            <button
              className="cursor-not-allowed w-full bg-teal-400 text-white py-3 rounded-lg font-semibold"
              disabled
            >
              Sign In...
            </button>
          ) : (
            <button
              className=" cursor-pointer w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold"
              onClick={handleLogin}
            >
              Sign In
            </button>
          )}

          {/* OR */}

          {/* <div className="flex items-center my-6">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
            <span className="px-4 text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div> */}

          {/* SOCIAL LOGIN */}

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
            Don’t have account?
            <span
              className="text-teal-600 font-semibold cursor-pointer"
              onClick={() => {
                setShowLoginPopup(false);
                setShowRegisterPopup(true);
              }}
            >
              {" "}
              Sign Up Now
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

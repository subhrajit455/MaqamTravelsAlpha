import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import Loginimage from "../assets/login.jpg";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../components/reducer/AuthSlice";
import { toast } from "react-toastify";
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
  setSubmitted,
}) => {
  const dispatch = useDispatch();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    const payload = {
      phone: data.mobilenumber,
      password: data.password,
    };
    dispatch(loginUser(payload)).then((response) => {
      const accessToken = localStorage.getItem("accessToken");
      if (response.payload.status === 200 && accessToken) {
        toast.success(response.payload.data.message||"Login successful!");
        setShowLoginPopup(true);
      } else if (response.payload.status === 401 ||response.payload.status === 409) {
        toast.error(response.payload.data.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
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
              <Phone
                className="absolute left-3 top-4 text-teal-400"
                size={18}
              />
              <input
                type="number"
                placeholder="Mobile Number"
                {...register("mobilenumber", {
                  required: "Mobile number is required",
                })}
                className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
              />
              {errors.mobilenumber && (
                <p className="text-red-500 text-sm py-2">
                  {errors.mobilenumber.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}

            <div className="mb-2 relative">
              <Lock className="absolute left-3 top-4 text-teal-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                })}
                className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
              />
              {errors.password && (
                <p className="text-red-500 text-sm py-2">
                  {errors.password.message}
                </p>
              )}
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
                onClick={handleSubmit(onSubmit)}
              >
                 {localStorage.getItem("accessToken") ? "Logout" : "Sign In"}
              </button>
            )}
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
    </form>
  );
};

export default Login;

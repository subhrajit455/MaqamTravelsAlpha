import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Phone, Image, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import Loginimage from "../assets/login.jpg";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../components/reducer/AuthSlice";
import { toast } from "react-toastify";
const Register = ({
  setShowLoginPopup,
  setShowRegisterPopup,
  isLoading,
  // register,
  setRegister,
  profileImage,
  setProfileImage,
  handleregister,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    dispatch(registerUser(data)).then((response) => {
      if (response?.payload?.status === 201) {
        localStorage.setItem("accessToken", response?.payload?.data?.data?.accessToken);
        localStorage.setItem( "refreshToken",response?.payload?.data?.data?.refreshToken);
        toast.success(response?.payload?.data?.message || "Registration successful!",);
        setShowRegisterPopup(false);
      } else if (
        response?.payload?.status === 400 ||
        response?.payload?.status === 409
      ) {
        

        toast.error(response?.payload?.data?.message || "Registration failed!");
      }
    });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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

            <div className="mb-4 relative">
              {/* Select Prefix */}
              <select
                // value={register.title}
                // onChange={(e) =>
                //   setRegister({ ...register, title: e.target.value })
                // }

                className="absolute left-2 bg-transparent text-teal-600 outline-none text-sm cursor-pointer border-r px-1"
              >
                <option value="Mr">Mr.</option>
                <option value="Mrs">Mrs.</option>
                <option value="Ms">Mrs.</option>
                <option value="Dr">Dr.</option>
              </select>

              {/* Icon */}
              <User
                className="absolute left-20 top-3 text-teal-400"
                size={18}
              />

              {/* Input */}
              <input
                type="text"
                placeholder="First Name"
                {...register("firstName", {
                  required: "First name is required",
                })}
                className="w-full pl-28 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm py-2">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/*Last name*/}

            <div className="mb-4 relative">
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
              <User
                className="absolute left-20 top-3 text-teal-400"
                size={18}
              />

              {/* Input */}
              <input
                type="text"
                placeholder="Last Name"
                {...register("lastName", { required: "Last name is required" })}
                className="w-full pl-28 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm py-2">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* EMAIL */}

            {/* PHONE */}

            <div className="mb-4 relative">
              <Phone
                className="absolute left-3 top-4 text-teal-400"
                size={18}
              />
              <input
                type="number"
                placeholder="Phone Number"
                {...register("phone", {
                  required: "phone is required",
                  pattern: {
                    value: /^[\+]?[0-9]{10,15}$/,
                    message: "Invalid phone number",
                  },
                })}
                className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm py-2">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}

            <div className="mb-4 relative">
              <Lock className="absolute left-3 top-4 text-teal-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
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

            {/* PROFILE IMAGE */}

            {/* <div className="mb-2 relative">
            <Image className="absolute left-3 top-4 text-teal-400" size={18} />
            <input
              type="file"
              accept="image/*"
              placeholder="Profile Image"
              onChange={(e) => setProfileImage(e.target.files[0])}
              className="w-full pl-10 pr-4 py-3 border border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-teal-400 cursor-pointer"
            />
          </div> */}

            {/* REGISTER BUTTON */}

            {isLoading ? (
              <button
                className=" cursor-not-allowed w-full bg-teal-400 text-white py-3 rounded-lg font-semibold"
                disabled
              >
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
    </form>
  );
};

export default Register;

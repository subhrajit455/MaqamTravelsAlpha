import React, { useState } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { ChevronDown } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

import {
  X,
  Save,
  Edit,
  ImageUp,
  User,
  Users,
  Laptop,
  ArrowBigLeftIcon,
  ArrowLeft,
  BadgeAlert,
} from "lucide-react";
import CommonHeader from "../components/CommonHeader";
import { toast } from "react-toastify";
import { UserAPI } from "../configs/api";

const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Child",
  "Sibling",
  "Friend",
  "Colleague",
  "Other",
];

const travelPreferenceOptions = [
  { value: "Adventure", label: "Adventure" },
  { value: "Beach", label: "Beach" },
  { value: "Family", label: "Family" },
  { value: "Luxury", label: "Luxury" },
  { value: "Nature", label: "Nature" },
  { value: "Pilgrimage", label: "Pilgrimage" },
  { value: "Shopping", label: "Shopping" },
  { value: "Wildlife", label: "Wildlife" },
];

const travelPreferenceAirlines = [
  { value: "AirIndia", label: "Air India" },
  { value: "IndiGo", label: "IndiGo" },
  { value: "AirIndiaExpress", label: "Air India Express" },
  { value: "AkasaAir", label: "Akasa Air" },
  { value: "SpiceJet", label: "SpiceJet" },
  { value: "AllianceAir", label: "Alliance Air" },
  { value: "Emirates", label: "Emirates" },
  { value: "QatarAirways", label: "Qatar Airways" },
  { value: "SingaporeAirlines", label: "Singapore Airlines" },
  { value: "EtihadAirways", label: "Etihad Airways" },
];

const passengerTypeOptions = [
  { value: "Adult", label: "Adult" },
  { value: "Child", label: "Child" },
  { value: "Infant", label: "Infant" },
];

const countryOptions = [
  {
    value: "+91",
    label: (
      <div className="flex items-center gap-2">
        <img
          src="https://flagcdn.com/w20/in.png"
          alt="India"
          className="w-5 h-4"
        />
        <span>+91</span>
      </div>
    ),
  },
  {
    value: "+1",
    label: (
      <div className="flex items-center gap-2">
        <img
          src="https://flagcdn.com/w20/us.png"
          alt="USA"
          className="w-5 h-4"
        />
        <span>+1</span>
      </div>
    ),
  },
];

const ProfileSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "gene.rodrig",
    email: "gene@gmail.com",
    phone: "9231836967",
    dateOfBirth: "1990-01-01",
    gender: "Male",
    maritalStatus: "Married",
    anniversaryDate: "1990-01-01",
    nationality: "India",
    addressLine1: "gene.webflow.io",
    addressLine2: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
    about: "",
  });

  const [activeTab, setActiveTab] = useState("profile");

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Example API call structure:
      const response = await fetch(UserAPI.userUpdateProfileApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("AuthToken")}`,
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Profile updated successfully!" || result.message);
        setIsEditing(false);
      } else {
        toast.error(result.message || "Failed to update profile");
      }

      // For demonstration, we'll just show success
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error.message);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values if needed
    setIsEditing(false);
  };

  return (
    <>
      <CommonHeader title="Profile Settings" />
      <div className="p-6 font-poppins lg:w-2/3 mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* LEFT PANEL */}
          <div className="col-span-1 space-y-4">
            <h2 className="font-semibold text-teal-600">Account Management</h2>
            <div
              className={` ${
                activeTab === "profile"
                  ? "bg-teal-100 flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 cursor-pointer"
                  : "flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 hover:bg-gray-200 cursor-pointer"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={20} color="#6B7280" />
              <p className="text-gray-400 text-sm">My Profile</p>
            </div>

            <div
              className={` ${
                activeTab === "co-travellers"
                  ? "bg-teal-100 flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 cursor-pointer"
                  : "flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 hover:bg-gray-200 cursor-pointer"
              }`}
              onClick={() => setActiveTab("co-travellers")}
            >
              <Users size={20} color="#6B7280" />
              <p className="text-gray-400 text-sm">Co-Travellers</p>
            </div>

            <div
              className={` ${
                activeTab === "logged-in-devices"
                  ? "bg-teal-100 flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 cursor-pointer"
                  : "flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 hover:bg-gray-200 cursor-pointer"
              }`}
              onClick={() => setActiveTab("logged-in-devices")}
            >
              <Laptop size={20} color="#6B7280" />
              <p className="text-gray-400 text-sm">Logged In Devices</p>
            </div>

            <div
              className={` ${
                activeTab === "Reset Password"
                  ? "bg-teal-100 flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 cursor-pointer"
                  : "flex items-center gap-2 bg-gray-100 p-2 rounded-md w-full h-12 hover:bg-gray-200 cursor-pointer"
              }`}
              onClick={() => setActiveTab("Reset Password")}
            >
              <Laptop size={20} color="#6B7280" />
              <p className="text-gray-400 text-sm">Reset Password</p>
            </div>

            <div className="border-l border-gray-300" />
          </div>

          {/* RIGHT PANEL */}

          <div className="col-span-2 bg-gray-50 p-4 md:p-6 rounded-xl shadow-inner">
            {activeTab === "profile" && (
              <div className="col-span-1 md:col-span-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <h2 className="font-semibold text-teal-600">
                    Profile Information
                  </h2>

                  {/* Edit Profile Button */}
                  <div>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? (
                            <>
                              <Save size={16} />
                              Saving changes...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Image Section - Centered */}
                <div className="flex justify-center">
                  <div className="bg-gray-200 rounded-full overflow-hidden w-36 h-36 lg:absolute lg:top-110">
                    <img
                      src="https://images.unsplash.com/photo-1776943340398-67524b7bcf7f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="profile"
                      className="w-36 h-36 md:h-36 object-cover rounded-full"
                    />
                  </div>
                  <label className="w-7 h-7 absolute mt-32 lg:mt-14 block cursor-pointer border border-teal-500 rounded-md  bg-teal-500 text-white text-xs text-center hover:bg-teal-600 transition">
                    <ImageUp
                      size={24}
                      color="currentColor"
                      className="lg:absolute lg:bottom-0 lg:mt-6"
                    />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      // onChange={(e) => console.log(e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Grid Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-20">
                  <Input
                    label="Name"
                    type="text"
                    value={profileData.name}
                    onChange={(value) => handleInputChange("name", value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Email (required)"
                    type="email"
                    value={profileData.email}
                    onChange={(value) => handleInputChange("email", value)}
                    disabled={true} // Email is always disabled
                  />
                  <Input
                    label="Phone"
                    value={profileData.phone}
                    onChange={(value) => handleInputChange("phone", value)}
                    disabled={!isEditing}
                  />

                  <div>
                    <label className="text-sm text-teal-500">
                      Date of Birth
                    </label>
                    <input
                      value={profileData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      type="date"
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-teal-500">Gender</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-teal-500">
                      Marital Status
                    </label>
                    <select
                      value={profileData.maritalStatus}
                      onChange={(e) =>
                        handleInputChange("maritalStatus", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option>Married</option>
                      <option>Single</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-teal-500">
                      Anniversary Date
                    </label>
                    <input
                      value={profileData.anniversaryDate}
                      onChange={(e) =>
                        handleInputChange("anniversaryDate", e.target.value)
                      }
                      type="date"
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <Input
                    label="Nationality"
                    value={profileData.nationality}
                    onChange={(value) =>
                      handleInputChange("nationality", value)
                    }
                    disabled={!isEditing}
                  />
                </div>

                {/* Contact Info */}
                <h2 className="font-semibold text-teal-600">Contact Info</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Address Line 1"
                    value={profileData.addressLine1}
                    onChange={(value) =>
                      handleInputChange("addressLine1", value)
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="Address Line 2"
                    value={profileData.addressLine2}
                    onChange={(value) =>
                      handleInputChange("addressLine2", value)
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="City"
                    value={profileData.city}
                    onChange={(value) => handleInputChange("city", value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="State"
                    value={profileData.state}
                    onChange={(value) => handleInputChange("state", value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Zip Code"
                    value={profileData.zipCode}
                    onChange={(value) => handleInputChange("zipCode", value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Country"
                    value={profileData.country}
                    onChange={(value) => handleInputChange("country", value)}
                    disabled={!isEditing}
                  />
                </div>

                {/* Contact Info */}
                <h2 className="font-semibold text-teal-600">
                  Preferences Info
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-teal-500">
                      Preferred Hotel Type
                    </label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option>Budget</option>
                      <option>Standard</option>
                      <option>Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-teal-500">
                      Meal Preference
                    </label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option>Veg</option>
                      <option>Non-Veg</option>
                      <option>Jain</option>
                      <option>Vegan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-teal-500">
                      Seat Preference
                    </label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option>Window</option>
                      <option>Aisle</option>
                      <option>Middle</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-teal-500">
                      Room Preference
                    </label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option>Smoking</option>
                      <option>Non-Smoking</option>
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h2 className="font-semibold text-teal-600 mb-2">
                    About the User
                  </h2>
                  <textarea
                    value={profileData.about}
                    onChange={(e) => handleInputChange("about", e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-teal-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    rows={5}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {activeTab === "co-travellers" && (
              <div className="flex flex-col w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <ArrowLeft size={20} color="#008CFF" strokeWidth={3} />

                    <h2 className="text-xl font-bold">Add New Co-Traveller</h2>
                  </div>

                  <div className="flex gap-2">
                    <button className="bg-gray-500 text-white px-4 py-2 rounded-md">
                      Cancel
                    </button>

                    <button className="bg-teal-500 text-white px-4 py-2 rounded-md">
                      Save
                    </button>
                  </div>
                </div>

                <div className="w-full border-b border-gray-200 mt-4" />

                <div className="w-full rounded-2xl bg-[#FFF4E6] px-5 py-3 mt-3">
                  <div className="flex items-center gap-4">
                    {/* Icon Box */}
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[#D98A00]">
                      <BadgeAlert
                        className="h-8 w-8 text-white"
                        strokeWidth={2.2}
                      />
                    </div>

                    {/* Text */}
                    <p className="text-[15px] font-medium text-[#C77700] leading-6">
                      Please double check if your First and Last name, Gender
                      &amp; Date of Birth match your Govt. ID such as Aadhaar or
                      Passport
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold text-teal-600 mb-2">
                    General Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  <Input
                    label="First Name"
                    placeholder="First Name"
                    type="text"
                    // value={coTravellerInfo.firstName}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        firstName: value,
                      })
                    }
                  />

                  <Input
                    label="Middle Name"
                    placeholder="Middle Name"
                    type="text"
                    // value={coTravellerInfo.lastName}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        lastName: value,
                      })
                    }
                  />

                  <Input
                    label="Last Name"
                    placeholder="Last Name"
                    type="text"
                    // value={coTravellerInfo.lastName}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        lastName: value,
                      })
                    }
                  />
                  <select
                    className="w-full h-12 border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    label="Gender"
                    // value={coTravellerInfo.gender}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        gender: value,
                      })
                    }
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <DatePicker
                    // selected={coTravellerInfo.dateOfBirth}
                    onChange={(date) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        dateOfBirth: date,
                      })
                    }
                    placeholderText="DATE OF BIRTH"
                    className="w-full h-12 border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Input
                    // label="Email"
                    placeholder="Email"
                    type="email"
                    // value={coTravellerInfo.email}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        email: value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                  <Input
                    label="Phone Number"
                    placeholder="Phone Number"
                    type="text"
                    // value={coTravellerInfo.lastName}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        lastName: value,
                      })
                    }
                  />
                  <div className="flex flex-col gap-1 py-6">
                    <select
                      className="w-full h-12 border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      label="Country Code"
                      // value={coTravellerInfo.countryCode}
                      onChange={(value) =>
                        setCoTravellerInfo({
                          ...coTravellerInfo,
                          countryCode: value,
                        })
                      }
                    >
                      <option value="">Select Country Code</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                    </select>
                  </div>
                  <Input
                    label="Country Name"
                    placeholder="Country Name"
                    type="text"
                    // value={coTravellerInfo.countryName}
                    onChange={(value) =>
                      setCoTravellerInfo({
                        ...coTravellerInfo,
                        countryName: value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2 w-full">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-teal-500">Passenger Type</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      options={passengerTypeOptions}
                      // value={travelPreference}
                      // onChange={setTravelPreference}
                      placeholder="Passenger Type"
                      isSearchable
                      className="text-sm"
                      classNamePrefix="react-select"
                      isSearchable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "45px",
                          borderRadius: "10px", // 👈 Border radius
                          borderColor: state.isFocused ? "#14B8A6" : "#5EEAD4",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(20,184,166,0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#14B8A6",
                          },
                        }),
                      }}
                    />
                    <Select
                      options={travelPreferenceOptions}
                      // value={travelPreference}
                      // onChange={setTravelPreference}
                      placeholder="Document Type"
                      isSearchable
                      className="text-sm"
                      classNamePrefix="react-select"
                      isSearchable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "45px",
                          borderRadius: "10px", // 👈 Border radius
                          borderColor: state.isFocused ? "#14B8A6" : "#5EEAD4",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(20,184,166,0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#14B8A6",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>

                {/*Passport Details */}

                <div className="grid gap-2 w-full mt-5">
                  <p className="text-sm text-teal-500">Passport Details</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      className="w-full h-12 border border-teal-300 rounded-md p-2  mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      // label="First Name"
                      placeholder="Passport number"
                      type="text"
                      // value={coTravellerInfo.firstName}
                      onChange={(value) =>
                        setCoTravellerInfo({
                          ...coTravellerInfo,
                          firstName: value,
                        })
                      }
                    />
                    <DatePicker
                      // selected={coTravellerInfo.dateOfBirth}
                      onChange={(date) =>
                        setCoTravellerInfo({
                          ...coTravellerInfo,
                          dateOfBirth: date,
                        })
                      }
                      placeholderText="EXPIRY DATE"
                      className="w-full h-12 border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {/* <Select
                      options={travelPreferenceOptions}
                      // value={travelPreference}
                      // onChange={setTravelPreference}
                      placeholder="Select your travel preference"
                      isSearchable
                      className="text-sm"
                      classNamePrefix="react-select"
                      isSearchable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "45px",
                          borderRadius: "10px", // 👈 Border radius
                          borderColor: state.isFocused ? "#14B8A6" : "#5EEAD4",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(20,184,166,0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#14B8A6",
                          },
                        }),
                      }}
                    /> */}
                  </div>
                </div>

                {/* Add contact information to receive booking details & other alerts */}
              </div>

              // <div>
              //   {/* Header */}
              //   <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
              //     <p className="text-lg font-semibold text-teal-500">
              //       Co-Travellers
              //     </p>

              //     <div className="flex items-center gap-2 cursor-pointer">
              //       <ArrowLeft size={20} color="#008CFF" strokeWidth={3} />
              //       <h2 className="text-xl font-bold">Add New Co-Traveller</h2>
              //     </div>
              //   </div>

              //   {/* Center Text */}
              //   <div className="w-full flex justify-center items-center mt-6">
              //     <h2 className="text-base font-semibold text-gray-600">
              //      -- Co-Travellers added here--
              //     </h2>
              //   </div>
              // </div>
            )}

            {activeTab === "logged-in-devices" && (
              <div>
                <h2>Logged In Devices</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSettings;

/* Reusable Components */

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  placeholder,
}) => (
  <div>
    <label className="text-sm text-teal-500">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </div>
);

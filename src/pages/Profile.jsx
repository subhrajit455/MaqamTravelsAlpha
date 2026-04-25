import React, { useState } from "react";
import { X, Save, Edit } from "lucide-react";
import CommonHeader from "../components/CommonHeader";
import { toast } from "react-toastify";
import { UserAPI } from "../configs/api";

const ProfileSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "gene.rodrig",
    // email: "gene@gmail.com",
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('AuthToken')}`
        },
        body: JSON.stringify(profileData)
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
      <div className="p-6 font-poppins max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6 grid grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="col-span-1 space-y-4">
            <h2 className="font-semibold text-teal-600">Account Management</h2>

            {/* Profile Image */}
            <div className="relative bg-gray-200 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e"
                alt="profile"
                className="w-full h-64 object-cover"
              />
              <button className="absolute top-3 right-3 bg-gray-300 p-1 rounded-full">
                <X size={16} />
              </button>
            </div>

            <button className="w-full border border-teal-500 rounded-md py-2 bg-teal-500 text-white">
              Upload Photo
            </button>

            {/* Password Section */}
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Old Password"
                className="w-full border border-teal-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full border border-teal-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button className="w-full border border-teal-500 rounded-md py-2 bg-teal-500 text-white">
                Change Password
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-teal-600">
                Profile Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
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

            {/* Grid Form */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={profileData.name}
                onChange={(value) => handleInputChange("name", value)}
                disabled={!isEditing}
              />
              <Input
                label="Email (required)"
                type="email"
                value={profileData.email}
                onChange={(value) => handleInputChange("email", value)}
                disabled={false} // Email is always disabled
              />
              <Input
                label="Phone"
                value={profileData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                disabled={!isEditing}
              />

              <div>
                <label className="text-sm text-teal-500">Date of Birth</label>
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
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  disabled={!isEditing}
                  className="w-full border border-teal-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-teal-500">Marital Status</label>
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
                onChange={(value) => handleInputChange("nationality", value)}
                disabled={!isEditing}
              />
            </div>

            {/* Contact Info */}
            <h2 className="font-semibold text-teal-600">Contact Info</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Address Line 1"
                value={profileData.addressLine1}
                onChange={(value) => handleInputChange("addressLine1", value)}
                disabled={!isEditing}
              />
              <Input
                label="Address Line 2"
                value={profileData.addressLine2}
                onChange={(value) => handleInputChange("addressLine2", value)}
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

import { useState } from "react";
import { AlertCircle, ChevronDown, Check, User, Phone, Mail, Building2 } from "lucide-react";

const TravellerDetails = () => {
  // Booking passenger limits
  const [bookingLimits] = useState({
    adult: 2,
    child: 1,
    infant: 1,
  });

  // Hardcoded saved travellers
  const [savedTravellers] = useState([
    {
      id: 1,
      travellerType: "Adult",
      title: "Mr",
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "Male",
      dob: "1992-05-15",
    },
    {
      id: 2,
      travellerType: "Adult",
      title: "Mrs",
      firstName: "Priya",
      lastName: "Sharma",
      gender: "Female",
      dob: "1994-08-22",
    },
    {
      id: 3,
      travellerType: "Child",
      title: "Master",
      firstName: "Aryan",
      lastName: "Sharma",
      gender: "Male",
      dob: "2018-03-10",
    },
  ]);

  // Track selected saved traveller IDs
  const [selectedTravellerIds, setSelectedTravellerIds] = useState([]);

  // Contact Details State
  const [contactDetails, setContactDetails] = useState({
    countryCode: "+91",
    mobile: "",
    email: "",
    sendUpdates: true,
  });

  // GST Details State
  const [gstDetails, setGstDetails] = useState({
    hasGst: false,
    gstNumber: "",
    companyName: "",
    companyAddress: "",
    companyEmail: "",
  });
  const [isGstExpanded, setIsGstExpanded] = useState(false);

  // Validation State
  const [validationErrors, setValidationErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Helper: Initialize Passenger Slots based on booking limits
  const initializePassengerSlots = () => {
    const slots = [];
    let slotId = 1;

    for (let i = 1; i <= bookingLimits.adult; i++) {
      slots.push({
        id: slotId++,
        type: "ADULT",
        slotTitle: `Adult ${i}`,
        title: "Mr",
        firstName: "",
        lastName: "",
        gender: "",
        dob: "",
        passport: "",
        airline: "",
        ffNumber: "",
        isCompleted: false,
        isExpanded: i === 1, // First slot expanded by default
        isFromSavedTraveller: false,
        savedTravellerId: null,
      });
    }

    for (let i = 1; i <= bookingLimits.child; i++) {
      slots.push({
        id: slotId++,
        type: "CHILD",
        slotTitle: `Child ${i}`,
        title: "Master",
        firstName: "",
        lastName: "",
        gender: "",
        dob: "",
        passport: "",
        airline: "",
        ffNumber: "",
        isCompleted: false,
        isExpanded: false,
        isFromSavedTraveller: false,
        savedTravellerId: null,
      });
    }

    for (let i = 1; i <= bookingLimits.infant; i++) {
      slots.push({
        id: slotId++,
        type: "INFANT",
        slotTitle: `Infant ${i}`,
        title: "Master",
        firstName: "",
        lastName: "",
        gender: "",
        dob: "",
        passport: "",
        airline: "",
        ffNumber: "",
        isCompleted: false,
        isExpanded: false,
        isFromSavedTraveller: false,
        savedTravellerId: null,
      });
    }

    return slots;
  };

  const [passengerSlots, setPassengerSlots] = useState(() => initializePassengerSlots());

  // Helper: Get count of completed passengers for a specific type
  const getSelectedCount = (type) => {
    return passengerSlots.filter(
      (slot) => slot.type.toLowerCase() === type.toLowerCase() && slot.isCompleted
    ).length;
  };

  // Helper: Get next available empty slot for a type
  const getNextAvailableSlot = (type) => {
    return passengerSlots.find(
      (slot) =>
        slot.type.toLowerCase() === type.toLowerCase() &&
        !slot.isCompleted &&
        !slot.savedTravellerId
    );
  };

  // Helper: Check if selection is allowed for type
  const canSelectTraveller = (type) => {
    const count = getSelectedCount(type);
    const limit = bookingLimits[type.toLowerCase()] || 0;
    return count < limit;
  };

  // Helper: Check if saved traveller checkbox should be disabled
  const isTravellerDisabled = (savedTraveller) => {
    const isAlreadySelected = selectedTravellerIds.includes(savedTraveller.id);
    if (isAlreadySelected) return false;
    return !canSelectTraveller(savedTraveller.travellerType);
  };

  // Helper: Assign saved traveller to slot
  const assignTravellerToSlot = (savedTraveller) => {
    if (!canSelectTraveller(savedTraveller.travellerType)) {
      alert(`Maximum ${savedTraveller.travellerType}s Selected`);
      return;
    }

    const availableSlot = getNextAvailableSlot(savedTraveller.travellerType);
    if (!availableSlot) {
      alert(`Maximum ${savedTraveller.travellerType}s Selected`);
      return;
    }

    setSelectedTravellerIds((prev) => [...prev, savedTraveller.id]);

    const inferredGender =
      savedTraveller.gender ||
      (savedTraveller.title === "Mr" || savedTraveller.title === "Master"
        ? "Male"
        : "Female");

    setPassengerSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === availableSlot.id) {
          return {
            ...slot,
            title: savedTraveller.title || slot.title,
            firstName: savedTraveller.firstName,
            lastName: savedTraveller.lastName,
            gender: inferredGender,
            dob: savedTraveller.dob || "",
            isCompleted: true,
            isExpanded: true, // Only one card open
            isFromSavedTraveller: true,
            savedTravellerId: savedTraveller.id,
          };
        }
        // Collapse all other slots when assigning
        return { ...slot, isExpanded: false };
      })
    );
  };

  // Helper: Remove saved traveller from slot
  const removeTravellerFromSlot = (savedTravellerId) => {
    setSelectedTravellerIds((prev) => prev.filter((id) => id !== savedTravellerId));

    setPassengerSlots((prev) =>
      prev.map((slot) => {
        if (slot.savedTravellerId === savedTravellerId) {
          return {
            ...slot,
            firstName: "",
            lastName: "",
            gender: "",
            dob: "",
            passport: "",
            isCompleted: false,
            isFromSavedTraveller: false,
            savedTravellerId: null,
          };
        }
        return slot;
      })
    );
  };

  // Checkbox toggle handler for saved travellers
  const handleSavedTravellerToggle = (savedTraveller) => {
    const isSelected = selectedTravellerIds.includes(savedTraveller.id);
    if (isSelected) {
      removeTravellerFromSlot(savedTraveller.id);
    } else {
      assignTravellerToSlot(savedTraveller);
    }
  };

  // Helper: Toggle passenger card accordion (Only one card open at a time)
  const togglePassenger = (slotId) => {
    setPassengerSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        isExpanded: slot.id === slotId ? !slot.isExpanded : false,
      }))
    );
  };

  // Helper: Update single passenger field
  const updatePassenger = (slotId, field, value) => {
    setPassengerSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          const updated = { ...slot, [field]: value };
          const isComplete = Boolean(
            updated.firstName?.trim() && updated.lastName?.trim() && updated.gender
          );
          return { ...updated, isCompleted: isComplete };
        }
        return slot;
      })
    );
  };

  // Helper: Validate individual passenger slot
  const validatePassenger = (slot) => {
    const errors = {};
    if (!slot.firstName?.trim()) errors.firstName = "First Name is required";
    if (!slot.lastName?.trim()) errors.lastName = "Last Name is required";
    if (!slot.gender) errors.gender = "Gender is required";
    return errors;
  };

  // Validate all forms on Continue
  const handleContinue = (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    const slotErrors = {};
    let hasSlotErrors = false;

    passengerSlots.forEach((slot) => {
      const errs = validatePassenger(slot);
      if (Object.keys(errs).length > 0) {
        slotErrors[slot.id] = errs;
        hasSlotErrors = true;
      }
    });

    const contactErrs = {};
    if (!contactDetails.mobile?.trim() || contactDetails.mobile.length < 10) {
      contactErrs.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!contactDetails.email?.trim() || !contactDetails.email.includes("@")) {
      contactErrs.email = "Enter a valid email address";
    }

    setValidationErrors({
      slots: slotErrors,
      contact: contactErrs,
    });

    if (hasSlotErrors || Object.keys(contactErrs).length > 0) {
      // Auto-expand the first slot with an error
      const firstErrorSlot = passengerSlots.find((s) => slotErrors[s.id]);
      if (firstErrorSlot) {
        togglePassenger(firstErrorSlot.id);
      }
      return;
    }

    alert("Traveller Details Submitted Successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Yellow Warning Banner (MakeMyTrip Style) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-bold">Important: </span>
          Enter your name exactly as on your Government ID / Passport.
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Saved Travellers Section */}
        {savedTravellers.length > 0 && (
          <div className="border-b border-gray-200 bg-slate-50 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              SAVED TRAVELLERS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedTravellers.map((traveller) => {
                const isSelected = selectedTravellerIds.includes(traveller.id);
                const disabled = isTravellerDisabled(traveller);

                return (
                  <label
                    key={traveller.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-400 text-blue-900 font-medium"
                        : disabled
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-200 hover:border-blue-300 text-gray-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => handleSavedTravellerToggle(traveller)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div className="flex-1 truncate">
                      <span className="font-semibold block truncate">
                        {traveller.title} {traveller.firstName} {traveller.lastName}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {traveller.travellerType}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories Header Counters */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">ADULTS (12 yrs+)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {getSelectedCount("Adult")} / {bookingLimits.adult} Added
              </span>
            </div>

            {bookingLimits.child > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">CHILDREN (2-12 yrs)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {getSelectedCount("Child")} / {bookingLimits.child} Added
                </span>
              </div>
            )}

            {bookingLimits.infant > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">INFANTS (0-2 yrs)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {getSelectedCount("Infant")} / {bookingLimits.infant} Added
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Passenger Cards Accordion */}
        <div className="divide-y divide-gray-200">
          {passengerSlots.map((slot) => {
            const slotErr = hasSubmitted && validationErrors.slots?.[slot.id];

            return (
              <div key={slot.id} className="transition-colors">
                {/* Passenger Card Header */}
                <div
                  onClick={() => togglePassenger(slot.id)}
                  className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
                    slot.isExpanded ? "bg-blue-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        slot.isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {slot.isCompleted ? <Check className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {slot.isCompleted
                            ? `${slot.title} ${slot.firstName} ${slot.lastName}`
                            : slot.slotTitle}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-gray-100 text-gray-600">
                          {slot.type}
                        </span>
                      </div>

                      {slot.isCompleted ? (
                        <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                          ✓ Traveller Details Added
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Requires First Name, Last Name & Gender
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      slot.isExpanded ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </div>

                {/* Passenger Card Body */}
                {slot.isExpanded && (
                  <div className="p-5 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Title
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={slot.title}
                          onChange={(e) => updatePassenger(slot.id, "title", e.target.value)}
                        >
                          {slot.type === "ADULT" && (
                            <>
                              <option value="Mr">Mr</option>
                              <option value="Mrs">Mrs</option>
                              <option value="Ms">Ms</option>
                            </>
                          )}
                          {(slot.type === "CHILD" || slot.type === "INFANT") && (
                            <>
                              <option value="Master">Master</option>
                              <option value="Miss">Miss</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            slotErr?.firstName ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="First & Middle Name"
                          value={slot.firstName}
                          onChange={(e) => updatePassenger(slot.id, "firstName", e.target.value)}
                        />
                        {slotErr?.firstName && (
                          <p className="text-xs text-red-500 mt-1">{slotErr.firstName}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            slotErr?.lastName ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Last Name"
                          value={slot.lastName}
                          onChange={(e) => updatePassenger(slot.id, "lastName", e.target.value)}
                        />
                        {slotErr?.lastName && (
                          <p className="text-xs text-red-500 mt-1">{slotErr.lastName}</p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            slotErr?.gender ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                          value={slot.gender}
                          onChange={(e) => updatePassenger(slot.id, "gender", e.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        {slotErr?.gender && (
                          <p className="text-xs text-red-500 mt-1">{slotErr.gender}</p>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={slot.dob}
                          onChange={(e) => updatePassenger(slot.id, "dob", e.target.value)}
                        />
                      </div>

                      {/* Passport Number */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Passport Number (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Passport Number"
                          value={slot.passport}
                          onChange={(e) => updatePassenger(slot.id, "passport", e.target.value)}
                        />
                      </div>

                      {/* Frequent Flyer Airline */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Frequent Flyer Airline
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={slot.airline}
                          onChange={(e) => updatePassenger(slot.id, "airline", e.target.value)}
                        >
                          <option value="">Select Airline</option>
                          <option value="IndiGo">IndiGo</option>
                          <option value="Air India">Air India</option>
                          <option value="Akasa Air">Akasa Air</option>
                        </select>
                      </div>

                      {/* Frequent Flyer Number */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          FF Number
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Frequent Flyer No."
                          value={slot.ffNumber}
                          onChange={(e) => updatePassenger(slot.id, "ffNumber", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Details Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Booking Details Will Be Sent To
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Your ticket & booking information will be sent to these contact details.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Country Code
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={contactDetails.countryCode}
              onChange={(e) =>
                setContactDetails((prev) => ({ ...prev, countryCode: e.target.value }))
              }
            >
              <option value="+91">India (+91)</option>
              <option value="+1">USA (+1)</option>
              <option value="+971">UAE (+971)</option>
              <option value="+966">Saudi Arabia (+966)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="tel"
                className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  hasSubmitted && validationErrors.contact?.mobile
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Mobile Number"
                value={contactDetails.mobile}
                onChange={(e) =>
                  setContactDetails((prev) => ({ ...prev, mobile: e.target.value }))
                }
              />
            </div>
            {hasSubmitted && validationErrors.contact?.mobile && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.contact.mobile}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  hasSubmitted && validationErrors.contact?.email
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Email Address"
                value={contactDetails.email}
                onChange={(e) =>
                  setContactDetails((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            {hasSubmitted && validationErrors.contact?.email && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.contact.email}
              </p>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={contactDetails.sendUpdates}
            onChange={(e) =>
              setContactDetails((prev) => ({ ...prev, sendUpdates: e.target.checked }))
            }
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          Send booking updates and flight status via WhatsApp / Email
        </label>
      </div>

      {/* GST Accordion Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          onClick={() => setIsGstExpanded(!isGstExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 select-none"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-500" />
            <div>
              <h4 className="font-semibold text-gray-800 text-sm">GST Details (Optional)</h4>
              <p className="text-xs text-gray-500">Claim credit on your GST invoice</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isGstExpanded ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>

        {isGstExpanded && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={gstDetails.hasGst}
                onChange={(e) =>
                  setGstDetails((prev) => ({ ...prev, hasGst: e.target.checked }))
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              I have a GST Number
            </label>

            {gstDetails.hasGst && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="22AAAAA0000A1Z5"
                    value={gstDetails.gstNumber}
                    onChange={(e) =>
                      setGstDetails((prev) => ({ ...prev, gstNumber: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Registered Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Company Name"
                    value={gstDetails.companyName}
                    onChange={(e) =>
                      setGstDetails((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Registered Company Address
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Company Address"
                    value={gstDetails.companyAddress}
                    onChange={(e) =>
                      setGstDetails((prev) => ({ ...prev, companyAddress: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Company Email"
                    value={gstDetails.companyEmail}
                    onChange={(e) =>
                      setGstDetails((prev) => ({ ...prev, companyEmail: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-base shadow-md transition-all hover:shadow-lg"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default TravellerDetails;

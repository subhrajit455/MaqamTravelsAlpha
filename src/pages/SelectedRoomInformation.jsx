import {
  ChevronUp,
  MapPin,
  Users,
  BadgeCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import CommonHeader from "../components/CommonHeader";
import ScrollToTop from "../components/ScrollToTop";

const SelectedRoomInformation = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return (
    <>
      <CommonHeader title="Hotel" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10 lg:translate-x-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-300">
            <h2 className="text-2xl font-bold text-[#1F2937] uppercase tracking-wide">
              Property Info
            </h2>

            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronUp size={20} className="text-gray-600" />
            </button>
          </div>
          {/* Hotel Details */}
          <div className="p-8  grid grid-cols-1 sm:grid-cols-2 lg:flex gap-6 mx-auto">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"
              alt=""
              className="w-36 h-36 rounded-xl object-cover"
            />

            <div className="flex-1">
              {/* Stars */}
              <div className="flex items-center gap-2">
                <div className="border rounded px-2 py-1 text-sm text-gray-700">
                  4 ⭐ · Hotel
                </div>
              </div>

              {/* Hotel Name */}
              <h3 className="text-lg font-bold text-gray-900 mt-3">
                Beira Mar Beach Resorts
              </h3>

              {/* Address */}
              <div className="flex items-center gap-2 mt-3 text-gray-500">
                <MapPin size={18} />
                <span className="text-lg">
                  Vasvaddo, Benaulim, Salcete, Goa
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-5">
                <span className="bg-green-600 text-white px-3 py-1 rounded font-semibold">
                  4.4/5
                </span>

                <span className="text-gray-600 text-lg">154 Ratings</span>
              </div>
            </div>
          </div>
          {/* Booking Info */}
          <div className="px-8 pb-8">
            <div className="w-full sm:max-w-md md:max-w-xl lg:max-w-full border border-gray-300 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Check In */}
                <div className="p-6">
                  <p className="text-gray-500 text-sm">Check In</p>

                  <h4 className="font-bold text-lg mt-1">Fri, 03 Jul, 2026</h4>

                  <p className="text-gray-600 mt-1">2 PM</p>
                </div>

                {/* Check Out */}
                <div className="p-6 border-t lg:border-t-0 lg:border-l border-gray-300">
                  <p className="text-gray-500 text-sm">Check Out</p>

                  <h4 className="font-bold text-lg mt-1">Sat, 04 Jul, 2026</h4>

                  <p className="text-gray-600 mt-1">11 AM</p>
                </div>

                {/* Guests */}
                <div className="p-6 border-t lg:border-t-0 lg:border-l border-gray-300">
                  <p className="text-gray-500 text-sm">Guests</p>

                  <div className="flex items-center gap-2 mt-1">
                    <Users size={22} />
                    <h4 className="font-bold text-lg">2 Adults</h4>
                  </div>

                  <p className="text-gray-600 mt-1">1 Night</p>
                </div>
              </div>
            </div>
          </div>
          {/* Room Card */}
          <div className="px-8 pb-8">
            <div className="border border-gray-300 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <p className="text-green-600 font-medium text-sm px-5 py-3">
                  Great Choice!
                </p>

                <h3 className="font-bold text-lg mt-1 px-5 py-3">Room</h3>
              </div>

              <div className="border-t mt-4 grid grid-cols-1 border-gray-300 lg:grid-cols-2">
                {/* Left */}
                <div className="p-6 border-r border-gray-300">
                  <h4 className="font-bold text-xl">1 × Classic Cottage</h4>

                  <div className="flex items-center gap-2 mt-5 text-gray-600">
                    <Users size={18} />
                    <span>2 Adults</span>
                  </div>
                  <p className="mt-3 text-gray-700">Room with Breakfast</p>
                </div>

                {/* Right */}
                <div className="p-6">
                  <div className="flex items-center gap-2 font-semibold">
                    <BadgeCheck size={18} className="text-gray-500" />
                    Room with Breakfast
                  </div>

                  <ul className="mt-5 space-y-3">
                    <li className="flex gap-3">
                      <span>•</span>
                      Breakfast included
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-4 pb-4">
            <button className="w-full max-w-md bg-[#917A00] text-gray-900 font-semibold py-3 rounded-2xl hover:bg-[#00BBA7]">
              Proceed To Payment Options
            </button>
          </div>
        </div>
        <div className="w-full max-w-md space-y-4 lg:mr-25">
          {/* Price Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-3xl font-bold text-gray-900">
                Price Summary
              </h2>

              <div className="flex items-center gap-3">
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  View Full Breakup
                </button>

                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-800">Base Price</p>
                  <p className="text-sm text-gray-500">(1 Room x 1 Night)</p>
                </div>

                <p className="font-semibold text-lg">₹6,460</p>
              </div>

              <div className="flex justify-between text-green-600 font-semibold">
                <p>Total Discount</p>
                <p>-₹2,335</p>
              </div>

              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <BadgeCheck size={16} fill="currentColor" />
                GOSMARTDEAL applied
              </div>

              <hr />

              <div className="flex justify-between">
                <p className="text-gray-800">Price after Discount</p>
                <p className="font-medium">₹4,125</p>
              </div>

              <div className="flex justify-between">
                <p className="text-gray-800">Taxes & Service Fees</p>
                <p className="font-medium">₹438</p>
              </div>
            </div>

            {/* Total */}
            <div className="border-t px-6 py-5">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Total Amount to be paid
                  </h3>

                  <p className="text-sm text-gray-500">
                    Includes taxes and fees
                  </p>
                </div>

                <h3 className="text-3xl font-bold">₹4,563</h3>
              </div>
            </div>

            {/* Login Banner */}
            <div className="bg-green-50 border-t px-6 py-4 flex items-center gap-3">
              <Sparkles className="text-blue-600" size={22} />

              <button className="text-blue-600 font-medium hover:underline">
                Login in now & get a lower price
              </button>
            </div>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </>
  );
};

export default SelectedRoomInformation;

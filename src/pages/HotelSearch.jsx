import { useState, useRef, useEffect } from "react";
import HotelDatePicker from "../components/datepicker/HotelDatePicker";
import RoomGuestSelector from "../components/roomguestselector/RoomGuestSelector";
import {
  ChevronDown,
  Contact,
  ArrowLeft,
  ArrowRight,
  Plane,
  Building2,
  Home,
  Package,
} from "lucide-react";
const travellingWay = ["All", "India"];
const HotelSearch = ({ searchbox }) => {
  const roomGuestRef = useRef(null);
  const [activeTab, setActiveTab] = useState("All");
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000));
  const [openPicker, setOpenPicker] = useState(null);
  const [openRoomguestselector, setOpenroomguestselector] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        roomGuestRef.current &&
        !roomGuestRef.current.contains(event.target)
      ) {
        setOpenroomguestselector(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openRoomguestselector]);

  console.log("openRoomguestselector====", openRoomguestselector);

  return (
    <>
      <div className="absolute  md:top-60 lg:top-10 left-1/2 -translate-x-1/2 w-[100%] lg:w-[80%] bg-white rounded-3xl  backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="grid grid-rosw-2">
          <div className="flex justify-center lg:justify-start">
            <div className="inline-flex flex-wrap gap-2 bg-gray-200 px-3 py-1 rounded-3xl">
              {travellingWay?.map((way, index) => (
                <div
                  key={index}
                  onClick={() => setActiveTab(way)}
                  className={`px-4 py-1 rounded-3xl font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap ${
                    activeTab === way
                      ? "bg-green-800 text-white"
                      : "bg-transparent text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {way}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1.3fr_1.4fr_1.3fr]">
              {/* CITY */}
              <div className="h-24 px-5 py-3 flex flex-col justify-center">
                <p className="text-xs text-gray-800 uppercase tracking-wide mb-1 font-bold">
                  CITY/AREA
                </p>

                <input
                  type="text"
                  placeholder="Enter City Name"
                  className="mt-2 w-full outline-none text-xl font-semibold placeholder:text-gray-400"
                />
              </div>

              {/* CHECK IN */}
              <div
                className="relative h-24  md:border-t-0 border-t md:border-l border-l  border-gray-200 
                 px-5 py-3 flex flex-col justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => setOpenPicker("checkIn")}
              >
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    CHECK IN
                  </p>

                  <ChevronDown size={14} />
                </div>

                <h2 className="text-3xl font-bold leading-none mt-2">
                  {checkIn.getDate()}{" "}
                  <span className="text-xl font-semibold">
                    {checkIn.toLocaleString("en-US", {
                      month: "short",
                    })}
                    '{String(checkIn.getFullYear()).slice(-2)}
                  </span>
                </h2>

                <p className="text-gray-600 text-sm mt-1">
                  {checkIn.toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                </p>
              </div>

              <HotelDatePicker
                open={openPicker == "checkIn"}
                setOpen={() => setOpenPicker(null)}
                selectedDate={checkIn}
                setSelectedDate={setCheckIn}
                type="checkIn"
              />

              {/* CHECK OUT */}
              <div
                className="h-24 md:border-t-0 border-t md:border-l border-l border-gray-200 
                px-5 py-3 flex flex-col justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => setOpenPicker("checkOut")}
              >
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    CHECK OUT
                  </p>

                  <ChevronDown size={14} />
                </div>

                <h2 className="text-3xl font-bold leading-none mt-2">
                  {checkOut.getDate()}{" "}
                  <span className="text-xl font-semibold">
                    {checkOut.toLocaleString("en-US", {
                      month: "short",
                    })}
                    '{String(checkOut.getFullYear()).slice(-2)}
                  </span>
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {checkOut.toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                </p>

                <HotelDatePicker
                  open={openPicker === "checkOut"}
                  setOpen={() => setOpenPicker(null)}
                  selectedDate={checkOut}
                  setSelectedDate={setCheckOut}
                  type="checkOut"
                />
              </div>

              {/* ROOM */}
              <div
                className="relative h-24 md:border-t-0 border-t md:border-l border-l border-gray-200
               px-5 py-3 flex flex-col justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => setOpenroomguestselector(true)}
              >
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    SELECT ROOM
                  </p>

                  <ChevronDown size={14} />
                </div>

                <p className="text-xl font-semibold mt-2">1 Room, 1 Guest</p>
              </div>

              {/* {openRoomguestselector && (
                <RoomGuestSelector
                  ref={roomGuestRef}
                  openRoomguestselector={openRoomguestselector}
                  setOpenroomguestselector={setOpenroomguestselector}
                />
              )} */}

              {openRoomguestselector && (
                <div
                  ref={roomGuestRef}
                  className="absolute lg:right-60 top-full"
                >
                  <RoomGuestSelector
                    openRoomguestselector={openRoomguestselector}
                    setOpenroomguestselector={setOpenroomguestselector}
                  />
                </div>
              )}

              {/* NATIONALITY */}
              <div className="h-24 md:border-t-0 border-t md:border-l border-l border-gray-200 px-5 py-3 flex flex-col justify-center cursor-pointer hover:bg-gray-50">
                <p className="text-xs font-bold uppercase text-gray-500">
                  NATIONALITY
                </p>

                <div className="flex justify-between items-center mt-2">
                  <p className="text-xl font-semibold">India</p>

                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center relative">
          <button
            className="absolute top-1 bg-gradient-to-r from-green-800 to-green-600
             hover:from-green-800 to-green-600
             text-white font-bold uppercase
             px-8 py-3
             rounded-md
             shadow-md
             transition-all duration-300
             cursor-pointer"
          >
            Search {searchbox}
          </button>
        </div>
      </div>
    </>
  );
};

export default HotelSearch;

import { useState, useRef,useEffect  } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import CommonHeader from "./CommonHeader";
import {
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Luggage,
  CheckCircle,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import FlightSearch from "../pages/Flight";
import CommonFlightHotelSearchBox from "./commonflighthotelsearchbox/CommonFlightHotelSearchBox";
import { fetchFlights } from "./reducer/FlightSearchSlice";
const airlines = [
  {
    id: 1,
    name: "IndiGo",
    logo: "🟦",
    count: 125,
  },
  {
    id: 2,
    name: "Air India",
    logo: "✈️",
    count: 98,
  },
  {
    id: 3,
    name: "Akasa Air",
    logo: "🟠",
    count: 42,
  },
  {
    id: 4,
    name: "SpiceJet",
    logo: "🔴",
    count: 36,
  },
  {
    id: 5,
    name: "Vistara",
    logo: "🟣",
    count: 28,
  },
  {
    id: 6,
    name: "AirAsia India",
    logo: "🔺",
    count: 22,
  },
  {
    id: 7,
    name: "Alliance Air",
    logo: "🛫",
    count: 14,
  },
];

const stopage = [
  {
    stop: "Stop",
    num: 1,
  },
  {
    stop: "Stop",
    count: 4,
  },
];

const dates = [
  { day: "Sun, Sep 13", price: "14,257" },
  { day: "Mon, Sep 14", price: "12,508", lowFare: true },
  { day: "Tue, Sep 15", price: "14,811" },
  { day: "Wed, Sep 16", price: "14,030", active: true },
  { day: "Thu, Sep 17", price: "13,896", lowFare: true },
  { day: "Fri, Sep 18", price: "12,398", lowFare: true },
  { day: "Sat, Sep 19", price: "17,226" },
  { day: "Sun, Sep 20", price: "13,864", lowFare: true },
  { day: "Sun, Sep 21", price: "13,864", lowFare: true },
  { day: "Sun, Sep 22", price: "13,864", lowFare: true },
  { day: "Sun, Sep 23", price: "13,864", lowFare: true },
  { day: "Sun, Sep 24", price: "13,864", lowFare: true },
  { day: "Sun, Sep 25", price: "13,864", lowFare: true },
  { day: "Sun, Sep 26", price: "13,864", lowFare: true },
  { day: "Sun, Sep 27", price: "13,864", lowFare: true },
  { day: "Sun, Sep 28", price: "13,864", lowFare: true },
];

const flightArray = [
  {
    resultIndex: "11-3103278170_0DELBOM9I11111~4837187726061791",
    totalAmount: 1747.9,
    isRefundable: false,
    segments: [
      {
        airline: "Alliance Air",
        airlineCode: "9I",
        flightNo: "11111",
        origin: "Delhi",
        originCode: "DEL",
        destination: "Mumbai",
        destinationCode: "BOM",
        departure: "2026-08-15T12:00",
        arrival: "2026-08-15T13:00",
        duration: 60,
        baggage: "5",
        cabinClass: "Economy",
        seatsLeft: 98,
      },
    ],
  },
  {
    resultIndex: "11-3103278170_3DELBOMAI2678~4837187726133573",
    totalAmount: 1747.9,
    isRefundable: true,
    segments: [
      {
        airline: "Air India",
        airlineCode: "AI",
        flightNo: "2678",
        origin: "Delhi",
        originCode: "DEL",
        destination: "Mumbai",
        destinationCode: "BOM",
        departure: "2026-08-15T08:30",
        arrival: "2026-08-15T10:45",
        duration: 135,
        baggage: "5",
        cabinClass: "Economy",
        seatsLeft: 98,
      },
    ],
  },
  {
    resultIndex: "OB109_0_103",
    totalAmount: 9055.2,
    isRefundable: true,
    segments: [
      {
        airline: "Air India",
        airlineCode: "AI",
        flightNo: "2678",
        origin: "Delhi",
        originCode: "DEL",
        destination: "Mumbai",
        destinationCode: "BOM",
        departure: "2026-08-15T08:30",
        arrival: "2026-08-15T10:45",
        duration: 135,
        baggage: "15 KG",
        cabinClass: "Economy",
        seatsLeft: 9,
      },
    ],
  },
  {
    resultIndex: "11-3103278170_1DELBOMIX6107~4837187726064911",
    totalAmount: 1747.9,
    isRefundable: true,
    segments: [
      {
        airline: "AI Express",
        airlineCode: "IX",
        flightNo: "6107",
        origin: "Delhi",
        originCode: "DEL",
        destination: "Mumbai",
        destinationCode: "BOM",
        departure: "2026-08-15T18:00",
        arrival: "2026-08-15T20:00",
        duration: 120,
        baggage: "5",
        cabinClass: "Economy",
        seatsLeft: 98,
      },
    ],
  },
];

const FlightCard = ({ flight, handlePriceConfirmation, isLoadingFlights }) => {
  const scrollRef = useRef(null);
  const { state } = useLocation();
   const dispatch = useDispatch();
    const { flightsData, loading, error } = useSelector(
      (state) => state.flightSearch,
    );
  const [selected, setSelected] = useState([]);
  const [openAirline, setOpenAirline] = useState(true);
  const [openTimePrice, setOpenTimePrice] = useState(true);
  const [openStopage, setOpenStopage] = useState(true);
  const [departure, setDeparture] = useState(24);
  const [arrival, setArrival] = useState(24);
  const [price, setPrice] = useState(29800);
  const [startIndex, setStartIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const flightState = state;
  const flights = state?.flights || [];

  const segment = flight?.itineraries?.[0]?.segments?.[0];

    useEffect(() => {
    dispatch(fetchFlights({})).then((res) => {
      console.log("res", res);
    });
  }, []);

  const handleCheckbox = (id) => {
    console.log("Check", id);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleNextDate = () => {
    console.log("Check");
    setStartIndex((prev) => {
      if (prev < dates.length - 8) {
        return prev + 1;
      }
      return prev;
    });
  };

  const handlePrevDate = () => {
    setStartIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  };

   console.log("flightsData", flightsData);

  return (
    <>
      <CommonHeader title="Flight" value={false} />
      <div className="sticky top-0 z-50 bg-white shadow">
        <CommonFlightHotelSearchBox headerChange={flights[0]?.showNavbar} />
      </div>
      <div className="max-w-7xl mx-auto pt-48 px-4">
        <div className="flex gap-6">
          <aside className="w-80 sticky top-44 self-start">
            <div className="w-full max-w-sm mt-3 rounded-lg bg-white border border-gray-200 p-4 shadow-sm max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {/* Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setOpenAirline(!openAirline)}
              >
                <h2 className="text-lg font-bold text-gray-900">Airlines</h2>

                <ChevronUp
                  className={`h-5 w-5 transition-transform ${
                    !openAirline ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* List */}
              {openAirline && (
                <div className="mt-4 space-y-3">
                  {airlines.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(item.id)}
                          onChange={() => handleCheckbox(item.id)}
                          className="h-5 w-5 rounded border-gray-300 accent-green-600"
                        />

                        <span className="text-lg">{item.logo}</span>

                        <span className="text-sm sm:text-base text-gray-700">
                          {item.name}
                        </span>
                      </div>

                      <span className="text-sm font-medium text-gray-700">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border border-b w-full border-gray-200 mt-2" />
              <div>
                {/* Header */}
                <div
                  className="flex items-center justify-between mt-2 cursor-pointer"
                  onClick={() => setOpenTimePrice(!openTimePrice)}
                >
                  <h2 className="text-xl font-bold">Time and Price</h2>

                  <ChevronUp
                    className={`transition-transform duration-300 ${
                      !openTimePrice ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {openTimePrice && (
                  <div className="space-y-8">
                    {/* Departure */}
                    <div>
                      <h3 className="mb-3 text-xl font-medium text-gray-700">
                        Departure From Paro
                      </h3>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                        className="w-full accent-blue-500"
                      />
                      <div className="mt-2 flex justify-between text-sm text-gray-600">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div>
                      <h3 className="mb-3 text-xl font-medium text-gray-700">
                        Arrival at Bengaluru
                      </h3>

                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={arrival}
                        onChange={(e) => setArrival(e.target.value)}
                        className="w-full accent-blue-500"
                      />

                      <div className="mt-2 flex justify-between text-sm text-gray-600">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <h3 className="mb-3 text-xl font-medium text-gray-700">
                        Flight Price
                      </h3>

                      <input
                        type="range"
                        min="29500"
                        max="29800"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full accent-blue-500"
                      />

                      <div className="mt-2 flex justify-between text-lg font-medium text-gray-700">
                        <span>₹29,500</span>
                        <span>₹29,800</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="border border-b w-full border-gray-200 mt-2" />
              </div>
              {/* Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setOpenStopage(!openStopage)}
              >
                <h2 className="text-lg font-bold text-gray-900">
                  Stop and Duration
                </h2>

                <ChevronUp
                  className={`h-5 w-5 transition-transform ${
                    !openStopage ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openStopage && (
                <div className="space-y-8">
                  {/* 1 Stop */}
                  <div className="grid grid-cols-3 gap-4">
                    <h3 className="mb-3 text-xl font-medium text-gray-700">
                      Stops
                    </h3>

                    <button
                      type="button"
                      className=" text-sm text-gray-400  border border-gray-200 rounded-sm py-1 cursor-pointer  hover:bg-gray-200"
                    >
                      1 Stop(1)
                    </button>

                    <button
                      type="button"
                      className=" text-sm text-gray-400  border border-gray-200 rounded-sm py-1 cursor-pointer hover:bg-gray-200"
                    >
                      1+ Stop(4)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1">
            <div>
              <div>
                <h1 className="w-full whitespace-nowrap text-2xl font-bold text-slate-900 sm:text-2xl md:text-2xl">
                  Flights from Bengaluru to Kolkata
                </h1>
              </div>
              <div className="relative max-w-4xl rounded-md border border-gray-200 bg-white shadow-sm mt-2">
                {/* Left Arrow */}
                <button
                  onClick={() => handlePrevDate()}
                  className="cursor-pointer absolute left-0 top-0 bottom-0 z-20 w-10 border-r border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5 text-blue-500" />
                </button>

                {/* Scroll Area */}
                <div className="overflow-x-auto scrollbar-hide px-10">
                  <div className="flex min-w-max">
                    {dates
                      .slice(startIndex, startIndex + 8)
                      .map((item, index) => {
                        const actualIndex = startIndex + index;

                        return (
                          <button
                            key={item.day}
                            onClick={() => setActiveTab(actualIndex)}
                            className={`w-[120px] flex-none border-r border-gray-200 py-4 cursor-pointer transition-all hover:bg-gray-50
                        ${activeTab === actualIndex ? "border-b-[3px] border-b-blue-600" : ""}`}
                          >
                            <p
                              className={`text-sm font-semibold ${
                                activeTab === actualIndex
                                  ? "text-blue-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {item.day}
                            </p>

                            <p
                              className={`mt-1 text-md font-semibold ${
                                activeTab === actualIndex
                                  ? "text-blue-600"
                                  : item.lowFare
                                    ? "text-green-600"
                                    : "text-gray-900"
                              }`}
                            >
                              ₹ {item.price}
                            </p>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => handleNextDate()}
                  className=" cursor-pointer absolute right-0 top-0 bottom-0 z-20 w-10 border-l border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5 text-blue-500" />
                </button>
              </div>

              <div className="py-2">
                {flightArray?.map((temp, index) => {
                  return temp?.segments?.map((segment, segmentIndex) => (
                    <div key={`${index}-${segmentIndex}`} className="p-1 mb-1">
                      <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
                        {/* Main Card */}
                        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
                          {/* Left */}
                          <div className="flex items-start gap-4">
                            {/* Airline Logo */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white font-bold">
                              A
                            </div>

                            <div>
                              <h3 className="text-base font-semibold text-gray-900">
                                {segment?.airline}
                              </h3>

                              <p className="text-sm text-gray-500">AK53</p>

                              <button className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                Add to compare
                                <span className="text-lg leading-none">+</span>
                              </button>
                            </div>
                          </div>

                          {/* Flight Info */}
                          <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-center lg:justify-center">
                            {/* Departure */}
                            <div className="text-center">
                              <h2 className="text-3xl font-bold text-gray-900">
                                21:05
                              </h2>

                              <p className="mt-1 text-sm text-gray-600">
                                {segment?.origin}
                              </p>
                            </div>

                            {/* Duration */}
                            <div className="min-w-[180px] flex-1">
                              <p className="text-center text-sm text-gray-500">
                                04 H 10 m
                              </p>

                              <div className="relative my-2">
                                <div className="h-[2px] bg-gray-300"></div>

                                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-500"></div>
                              </div>

                              <p className="text-center text-sm text-gray-500">
                                Non stop
                              </p>
                            </div>

                            {/* Arrival */}
                            <div className="text-center">
                              <h2 className="text-3xl font-bold text-gray-900">
                                22:45
                              </h2>

                              <p className="mt-1 text-sm text-gray-600">
                                {segment?.destination}
                              </p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="w-full lg:w-auto">
                            <div className="flex flex-col items-center lg:items-end">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through">
                                  ₹{temp?.totalAmount}
                                </span>

                                <span className="text-3xl font-bold text-black">
                                  ₹{temp?.totalAmount}
                                </span>
                              </div>

                              <span className="text-sm text-gray-500">
                                /adult
                              </span>

                              <span className="mt-1 text-sm font-medium text-red-500">
                                ₹1,090 Instant Discount
                              </span>

                              <button className="mt-4 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                                VIEW PRICES
                              </button>

                              <button className="mt-3 rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                                🔒 Lock this price @ ₹290 →
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Offer Banner */}
                        <div className="bg-orange-50 px-5 py-3">
                          <p className="text-center text-sm text-gray-700">
                            <span className="mr-2 text-red-400">●</span>
                            Get special Rs 1090 OFF using MMTMAXX
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-medium text-red-500">
                            Non Refundable
                          </span>

                          <button className="font-medium text-blue-600 hover:underline">
                            View Flight Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ));
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default FlightCard;

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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
import FlightLoader from "./loader/FlightLoader";
import MoreFlightDetails from "./modal/MoreFlightDetails";
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
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { state } = useLocation();
  const dispatch = useDispatch();
  const { flightsData, loading, error } = useSelector(
    (state) => state.flightSearch,
  );

  
  const flightsdata = flightsData?.data?.data?.outbound || [];


  const maxPrice = Math.max(
    ...flightsdata.map((f) => Number(f.totalAmount || 0)),
    0,
  );


  // console.log("price!=====", price);
  console.log("maxPrice changed!:", maxPrice);



  console.log

  const minPrice = Math.min(
    ...flightsdata.map((f) => Number(f.totalAmount || 0)),
    maxPrice,
  );
  const [selected, setSelected] = useState([]);
  const [openAirline, setOpenAirline] = useState(true);
  const [openTimePrice, setOpenTimePrice] = useState(true);
  const [openStopage, setOpenStopage] = useState(true);
  const [openFareQuote, setOpenFareQuote] = useState(false);
  const [departure, setDeparture] = useState(24);
  const [arrival, setArrival] = useState(24);
  const [price, setPrice] = useState(maxPrice);
  const [startIndex, setStartIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const flightState = state;
  const flights = state?.flights || [];
  const segment = flight?.itineraries?.[0]?.segments?.[0];

  const airlineFilteredFlights =
    selected.length === 0
      ? flightsdata
      : flightsdata.filter((flight) => {
          const segment = flight.segments?.[0];
          return selected.includes(segment?.airlineCode);
        });

  const filteredFlights = airlineFilteredFlights.filter((flight) => {
    const segment = flight.segments?.[0];
    if (!segment) return false;

    const departureHour = new Date(segment.departure).getHours();
    const arrivalHour = new Date(segment.arrival).getHours();
    const flightPrice = Number(flight.totalAmount);

    // console.log({
    //   sliderPrice: price,
    //   flightPrice,
    //   match: flightPrice <= Number(price),
    // });

    return (
      departureHour <= departure &&
      arrivalHour <= arrival &&
      flightPrice <= Number(price)
    );
  });

  const airlines = Object.values(
    flightsdata.reduce((acc, flight) => {
      const segment = flight.segments?.[0];
      if (!segment) return acc;

      const { airline, airlineCode } = segment;

      // Normalize the airline name
      const key = airline.trim().toLowerCase();

      if (!acc[key]) {
        acc[key] = {
          airlineCode,
          airline: key === "indigo" ? "IndiGo" : airline,
          count: 0,
        };
      }
      acc[key].count++;

      return acc;
    }, {}),
  );

  useEffect(() => {
    console.log("maxPrice changed:", maxPrice);
  }, [maxPrice]);

  useEffect(() => {
    console.log("price state:", price);
  }, [price]);

  useEffect(() => {
    if (flightsData?.data) return;

    const savedSearch = JSON.parse(localStorage.getItem("flightSearch"));

    if (savedSearch) {
      dispatch(fetchFlights(savedSearch));
    }
  }, [dispatch, flightsData]);

  const handleCheckbox = (id) => {
    console.log("Check", id);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleNextDate = () => {
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

  const handleFlightSearch = () => {
    dispatch(fetchFlights(searchFlights));
  };

  
  return (
    <>
      <CommonHeader title="Flight" value={false} />
      <div className="sticky top-0 z-50 bg-white shadow">
        <CommonFlightHotelSearchBox headerChange={flights[0]?.showNavbar} />
      </div>
      <div className="max-w-2/3 mx-auto pt-6">
        <div className="flex gap-6">
          <aside className="w-full sticky top-44 self-start">
            <div className="w-lg p-2 max-w-sm mt-3 rounded-lg bg-white border border-gray-200 shadow-sm max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
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
                      key={item.airlineCode}
                      className="flex items-center justify-between py-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(item.airlineCode)}
                          onChange={() => handleCheckbox(item.airlineCode)}
                          className="h-5 w-5 rounded border-gray-300 accent-green-600"
                        />
                        <img
                          src={`https://images.kiwi.com/airlines/64/${item.airlineCode}.png`}
                          alt={item.airline}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            e.target.src =
                              "https://cdn-icons-png.flaticon.com/512/684/684908.png";
                          }}
                        />

                        <span className="text-sm sm:text-base text-gray-700">
                          {item.airline}
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-gray-700">
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
                        onChange={(e) => setDeparture(Number(e.target.value))}
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
                        onChange={(e) => setArrival(Number(e.target.value))}
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
                        min={minPrice}
                        max={maxPrice}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />

                      <div className="mt-2 flex justify-between text-lg font-medium text-gray-700">
                        <span>₹{minPrice}</span>
                        <span>₹{maxPrice}</span>
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
                {loading && <FlightLoader />}

                {!loading && (
                  <>
                    {filteredFlights?.map((temp, index) => {
                      return temp?.segments?.map((segment, segmentIndex) => (
                        <div
                          key={`${index}-${segmentIndex}`}
                          className="p-1 mb-1"
                        >
                          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm w-4xl">
                            {/* Top Badge */}
                            <div className="absolute left-6 top-0 -translate-y-1/2 rounded-full bg-[#E8F8EF] px py-1 text-xs font-medium text-[#0B8A43]">
                              100% on time
                            </div>

                            {/* Main Section */}
                            <div className="flex items-center px-8 py-6">
                              {/* Airline */}
                              <div className="flex w-[220px] items-center gap-3">
                                <img
                                  src={`https://images.kiwi.com/airlines/64/${segment.airlineCode}.png`}
                                  alt={segment.airline}
                                  className="h-12 w-12 object-contain"
                                />

                                <div>
                                  <h3 className="text-[18px] font-semibold leading-5 text-gray-900">
                                    {segment.airline}
                                  </h3>

                                  <p className="mt-1 text-[15px] text-gray-500">
                                    {segment.flightNumber || "QP-1526"}
                                  </p>
                                </div>
                              </div>

                              {/* Departure */}
                              <div className="w-[110px] text-center">
                                <h2 className="text-[22px] font-bold leading-none text-gray-900">
                                  {segment.departure.split("T")[1].slice(0, 5)}
                                </h2>

                                <p className="mt-2 text-[15px] font-semibold text-[#D58512]">
                                  {segment.origin}
                                </p>
                              </div>

                              {/* Duration */}
                              <div className="mx-8 w-[110px]">
                                <p className="text-center text-[15px] text-gray-500">
                                  03h 05m
                                </p>

                                <div className="my-1 h-px bg-gray-300"></div>

                                <p className="text-center text-[15px] text-gray-500">
                                  Non stop
                                </p>
                              </div>

                              {/* Arrival */}
                              <div className="w-[110px] text-center">
                                <h2 className="text-[22px] font-bold leading-none text-gray-900">
                                  {segment.arrival.split("T")[1].slice(0, 5)}
                                </h2>

                                <p className="mt-2 text-[15px] text-gray-700">
                                  {segment.destination}
                                </p>
                              </div>

                              {/* Divider */}
                              <div className="mx-8 h-16 w-px bg-gray-300"></div>

                              {/* Price */}
                              <div className="ml-auto flex w-[280px] flex-col items-end">
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <h2 className="text-[22px] font-bold leading-none text-gray-900">
                                      ₹{temp?.totalAmount}
                                    </h2>
                                  </div>

                                  <button
                                    onClick={() => {
                                      navigate("/fare-quote-details", {
                                        state: {
                                          traceId:
                                            flightsData?.data?.data?.traceId,
                                          resultIndex: temp?.resultIndex,
                                        },
                                      });
                                    }}
                                    className="h-10 rounded-lg border border-blue-600 bg-white px-5 text-[14px] font-semibold text-blue-600 transition hover:bg-blue-50 cursor-pointer"
                                  >
                                    VIEW PRICES
                                  </button>
                                </div>

                                <p className="mt-4 text-[15px] font-semibold text-[#008060]">
                                  FLAT 10% OFF using MMT...
                                </p>
                              </div>
                            </div>

                            {/* Bottom Section */}
                            <div className="flex h-14 items-center justify-between border-t border-gray-200 bg-white">
                              <button
                                onClick={() => setOpenFareQuote(true)}
                                className="flex h-full items-center gap-2 px-8 text-[14px] text-gray-700 hover:text-blue-600"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9m-5-4H9m5 0v5m0-5l-7 7"
                                  />
                                </svg>
                                More flight details
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>

                              {/* Lock Price */}
                              <div
                                className="flex h-full items-center bg-[#F2F8FF] px-8 text-[15px] font-medium text-blue-600"
                                style={{
                                  clipPath:
                                    "polygon(12% 0%,100% 0%,100% 100%,0% 100%)",
                                }}
                              >
                                {/* 🔒 Lock this price @ ₹233 → */}
                                {"       "}
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    })}
                    <MoreFlightDetails
                      openFareQuote={openFareQuote}
                      setOpenFareQuote={setOpenFareQuote}
                    />
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default FlightCard;

import React, { useEffect, useState } from "react";
import CommonHeader from "../components/CommonHeader";
import DestinationCard from "../components/DestinationCard";
import FeaturedCard from "../components/FeaturedCard";
import { BookOpen, Search, Calendar, Users } from "lucide-react";
import MakkahImage from "../assets/makkah.jpg";
import MadinahImage from "../assets/madinah.jpg";
const Hotel = () => {
  const options = [
    {
      label: "Makkah",
      value: "JED",
      icon: <BookOpen size={18} />,
      image: MakkahImage,
    },
    {
      label: "Madinah",
      value: "MED",
      icon: <Search size={18} />,
      image: MadinahImage,
    },
  ];

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("MED");
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const limit = 9;

  // const fetchSearch = async () => {
  //   try {
  //     setLoading(true);

  //     const res = await fetch(
  //       `${SearchAPI.SearchApi}?iataCode=${selected}&limit=${limit}&page=${page}`,
  //     );

  //     const result = await res.json();

  //     setData(result?.data || []);
  //   } catch (error) {
  //     console.error("Search API error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchSearchAllData = async (query) => {
    try {
      setLoading(true);
      const encodedQuery = encodeURIComponent(query.trim());

      // const res = await fetch(
      //   `${SearchAPI.SearchAllDataApi}?title=${encodedQuery}&iataCode=${selected}&limit=${limit}&page=${page}`,
      // );

      const res = await fetch("https://jsonplaceholder.typicode.com/users");
      const result = await res.json();

      const sourceData = Array.isArray(result)
        ? result
        : result?.data || result || [];

      const startIndex = (page - 1) * limit;
      const paginatedData = sourceData.slice(startIndex, startIndex + limit);

      setData(paginatedData);
    } catch (error) {
      console.error("SearchAllData API error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchAllData(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selected, page]);

  const handleSearch = () => {
    fetchSearchAllData(searchQuery);
  };

  return (
    <>
      <CommonHeader title="Hotel" />
      <div className="max-w-7xl mx-auto font-poppins z-10">
        {/* Top Section */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 rounded-2xl p-4 md:p-6 shadow-lg mt-4 relative">
          <div className="flex flex-col xl:flex-row gap-3 w-full">
            <div className="w-full xl:w-72 relative">
              <div
                onClick={() => setOpen(!open)}
                className="bg-white/95 text-teal-700 h-[48px] px-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 font-medium shadow-sm border border-white/60"
              >
                <div className="flex items-center gap-2">
                  <Search size={18} />
                  <span>
                    {options.find((option) => option.value === selected)?.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500">▼</span>
              </div>

              {open && (
                <div className="absolute left-0 right-0 mt-2 text-teal-700 bg-white border border-teal-100 font-normal rounded-xl shadow-xl z-20 overflow-hidden">
                  {options.map((item) => (
                    <div
                      key={item.value}
                      onClick={() => {
                        setSelected(item.value);
                        setPage(1);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-none"
                    >
                      <div className="flex gap-2 items-center">
                        <Search size={18} />
                        <span>{item.label}</span>
                      </div>

                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.label}
                          className="w-16 h-10 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full xl:flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hotels, city or country"
                className="w-full h-[48px] pl-10 pr-4 rounded-xl border border-white/70 bg-white shadow-sm outline-none focus:ring-2 focus:ring-white/70"
              />
            </div>

            <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-2 bg-white/95 rounded-xl px-3 py-2 shadow-sm h-12">
                <Calendar size={16} className="text-teal-600" />
                <div className="flex flex-col">
                  <label className="text-[11px] text-gray-500">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/95 rounded-xl px-3 py-2 shadow-sm h-12">
                <Calendar size={16} className="text-teal-600" />
                <div className="flex flex-col">
                  <label className="text-[11px] text-gray-500">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/95 rounded-xl px-3 py-2 shadow-sm h-12">
                <Users size={16} className="text-teal-600" />
                <div className="flex flex-col min-w-[150px]">
                  <label className="text-[11px] text-gray-500">
                    Guest & Room
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Guests</span>
                      <div className="flex items-center border rounded-md overflow-hidden h-5">
                        <button
                          type="button"
                          onClick={() =>
                            setGuests((prev) => Math.max(1, prev - 1))
                          }
                          className="px-2 py-1 text-lg text-teal-700 hover:bg-teal-50"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">
                          {guests}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setGuests((prev) => Math.min(40, prev + 1))
                          }
                          className="px-2 py-1 text-lg text-teal-700 hover:bg-teal-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Rooms</span>
                      <div className="flex items-center border rounded-md overflow-hidden h-5">
                        <button
                          type="button"
                          onClick={() =>
                            setRooms((prev) => Math.max(1, prev - 1))
                          }
                          className="px-2 py-1 text-lg text-teal-700 hover:bg-teal-50"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">
                          {rooms}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRooms((prev) => Math.min(20, prev + 1))
                          }
                          className="px-2 py-1 text-lg text-teal-700 hover:bg-teal-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center xl:absolute xl:left-1/2 xl:-translate-x-1/2 xl:top-16 xl:mt-4">
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-teal-50 transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Data */}
        {!loading && (
          <>
            {data.length === 0 ? (
              <div className="text-center text-gray-600 mt-16">
                No hotels found. Try a different search term.
              </div>
            ) : (
              <>
                <div className="mt-12">
                  <div className="text-lg font-semibold text-gray-800 justify-items-center items-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-purple-600 bg-clip-text text-transparent">
                      Offer for you
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                      {data.map((item, i) => (
                        <div key={i}>
                          <FeaturedCard item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <div className="text-lg font-semibold text-gray-800 justify-items-center items-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-purple-600 bg-clip-text text-transparent">
                      Recommended for you
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                      {data.map((item, i) => (
                        <div key={i}>
                          <FeaturedCard item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 justify-items-center items-center">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-purple-600 bg-clip-text text-transparent">
                    All Hotels List
                  </h2>
                </div>

                <div className="justify-items-center items-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {data.map((item, i) => (
                      <div key={i}>
                        <DestinationCard item={item} variant="list" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="flex justify-center gap-4 mt-10 pb-10">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className={`px-5 py-2 rounded-lg text-white  ${
                page === 1
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-500 cursor-pointer"
              }`}
            >
              Previous
            </button>

            <span className="flex items-center font-semibold text-teal-700">
              Page {page}
            </span>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Hotel;

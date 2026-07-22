// FlightLoader.jsx
import { useEffect, useState } from "react";
import CommonHeader from "../CommonHeader";
import flightSearchAnimation from "../../assets/flightSearchAnimation.gif";

const messages = [
  "Searching 500+ airlines...",
  "Checking latest fares...",
  "Finding the best deals...",
  "Almost there...",
];

export default function FlightLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden"
      style={{ backgroundColor: "#F4F4F4" }}
    >
      {/* Top Header - MakeMyTrip style matching list page */}
      <div className="w-full">
        <CommonHeader title="Flight" value={false} />
      </div>

      {/* Loader Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-8">
        {/* Plane Animation */}
        <div className="relative w-full max-w-4xl flex justify-center">
          <img
            src={flightSearchAnimation}
            alt="Searching flights"
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Animated Message */}
        <p className="text-sm font-semibold text-gray-700 mt-4 animate-pulse">
          {messages[messageIndex]}
        </p>

        {/* Progress Bar */}
        <div className="w-72 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <div className="progress"></div>
        </div>
      </div>
    </div>
  );
}

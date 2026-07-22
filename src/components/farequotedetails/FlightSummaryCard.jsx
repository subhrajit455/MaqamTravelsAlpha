import {
  Plane,
  Briefcase,
  Luggage,
  Clock,
} from "lucide-react";

const FlightSummaryCard = () => {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

      {/* Alert */}

      <div className="bg-orange-100 text-orange-700 text-sm px-4 py-2">

        Your flight goes to Hindon Airport, 32 km away from IGI Airport.

      </div>

      <div className="p-5">

        <div className="flex flex-col lg:flex-row justify-between gap-5">

          <div>

            <h2 className="text-2xl font-bold">
              Kolkata → Ghaziabad
            </h2>

            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">

              <span>Thursday, Oct 22</span>

              <span>Non Stop</span>

              <span>2h 40m</span>

            </div>

            <div className="mt-5 flex items-center gap-3">

              <Plane className="w-5 h-5 text-blue-700" />

              <div>

                <p className="font-semibold">
                  IndiGo • 6E 2588
                </p>

                <p className="text-sm text-gray-500">
                  Airbus A320
                </p>

              </div>

            </div>

          </div>

          <button className="bg-green-600 text-white rounded-lg px-5 py-2 h-fit">
            Cancellation Fees Apply
          </button>

        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">

          <div>

            <p className="text-xl font-bold">
              12:45
            </p>

            <p className="font-semibold">
              Kolkata
            </p>

            <p className="text-gray-500">
              Netaji Subhash Chandra Bose Airport
            </p>

          </div>

          <div>

            <p className="text-xl font-bold">
              15:25
            </p>

            <p className="font-semibold">
              Ghaziabad
            </p>

            <p className="text-gray-500">
              Hindon Airport
            </p>

          </div>

        </div>

        <div className="mt-8 border-t border-gray-200 pt-5 flex flex-wrap gap-8">

          <div className="flex gap-2">

            <Briefcase />

            Cabin 7kg

          </div>

          <div className="flex gap-2">

            <Luggage />

            Check-in 15kg

          </div>

        </div>

      </div>

    </div>
  );
};

export default FlightSummaryCard;
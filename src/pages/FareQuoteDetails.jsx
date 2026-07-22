import { Plane, Briefcase, Luggage, Clock } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import CommonHeader from "../components/CommonHeader";
import FlightSummaryCard from "../components/farequotedetails/FlightSummaryCard";
import ImportantInformation from "../components/farequotedetails/ImportantInformation";
import TravellerDetails from "../components/farequotedetails/TravellerDetails";
import { getFareQuote } from "../components/reducer/FlightSearchSlice";
const FareQuoteDetails = () => {
  const { state } = useLocation();
  const { traceId, resultIndex } = state;
  const dispatch = useDispatch();
  const { fareQuote, loading, error } = useSelector(
    (state) => state.getFareQuote,
  );
  useEffect(() => {
    dispatch(getFareQuote({ traceId, resultIndex }));
  }, [dispatch, traceId, resultIndex]);

  console.log("fareQuote", fareQuote);

  return (
    <>
      <CommonHeader />
      <div className="grid grid-rows-3">
        <div className="min-h-screen bg-slate-100 py-6">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            {/* Page Heading */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-800">
                Complete Your Booking
              </h1>

              <p className="text-gray-500 mt-1">
                Please review your flight details and fill traveller
                information.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Side */}
              <div className="xl:col-span-8 space-y-6">
                <FlightSummaryCard />

                <ImportantInformation />

                <TravellerDetails />
              </div>

              {/* Right Side */}
              <div className="xl:col-span-4">
                <div className="sticky top-5">
                  <div className="bg-white rounded-xl shadow border border-gray-200">
                    <div className="border-b border-gray-200  p-5">
                      <h2 className="font-semibold text-lg">Fare Summary</h2>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex justify-between">
                        <span>Base Fare</span>
                        <span>₹6,450</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Taxes & Fees</span>
                        <span>₹1,170</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Convenience Fee</span>
                        <span>₹249</span>
                      </div>

                      <div className="border-b border-gray-200 max-w-auto" />

                      <div className="flex justify-between text-lg font-bold text-blue-700">
                        <span>Total</span>

                        <span>₹7,869</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FareQuoteDetails;

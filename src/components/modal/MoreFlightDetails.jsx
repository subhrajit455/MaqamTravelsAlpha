const MoreFlightDetails = ({
  openFareQuote,
  open,
  onClose,
  setOpenFareQuote,
}) => {
  return (
    <>
      {openFareQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpenFareQuote(false)} // Close when clicking backdrop
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <h2 className="text-xl font-semibold mb-4">More Flight Details</h2>

            <p>More Flight Details goes here...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default MoreFlightDetails;

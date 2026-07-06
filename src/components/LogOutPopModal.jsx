import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../components/reducer/AuthSlice";
const LogOutPopModal = ({ isModalOpen, setModalOpen }) => {
  const dispatch = useDispatch();
  const handleLogout = () => {
    console.log("Logout button clicked");
    dispatch(logoutUser()).then((response) => {
      if (response.payload.status === 200) {
        toast.success(response.payload.data.message);
        setModalOpen(false);
      } else if (
        response.payload.status === 401 ||
        response.payload.status === 409
      ) {
        toast.error(response.payload.data.message);
      }
    });
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleLogout}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  // Add logout logic here
                }}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogOutPopModal;

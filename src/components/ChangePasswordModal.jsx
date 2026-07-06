import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { resetPassword } from "./reducer/AuthSlice";
const ChangePasswordModal = ({
  isResetPasswordModal,
  setResetPasswordModal,
}) => {
  const dispatch = useDispatch();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    console.log("data!", data);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {isResetPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[620px] rounded-xl bg-white p-6">
              <h3 className="mb-6 text-xl font-semibold">Change Password</h3>

              {/* Old Password */}
              <div className="relative mb-5">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-semibold text-green-600 uppercase">
                  Old Password
                </label>

                <input
                  placeholder="Enter your old password"
                  type={showOldPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-500 bg-gray-100 px-4 py-4 pr-12 outline-none focus:ring-2 focus:ring-green-500"
                  {...register("oldpassword", {
                    required: "Old Password is required",
                  })}
                />
                {errors.oldpassword && (
                  <p className="text-red-500 text-sm py-2">
                    {errors.oldpassword.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* New Password */}
              <div className="relative mb-5">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-semibold text-green-600 uppercase">
                  New Password
                </label>

                <input
                  placeholder="Enter your new password"
                  type={showNewPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-4 pr-12 outline-none focus:ring-2 focus:ring-green-500"
                  {...register("newpassword", {
                    required: "New Password is required",
                  })}
                />
                {errors.newpassword && (
                  <p className="text-red-500 text-sm py-2">
                    {errors.newpassword.message}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setResetPasswordModal(false);
                    setResetPasswordModal(false);
                  }}
                  className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
};

export default ChangePasswordModal;

import { Minus, Plus, PawPrint } from "lucide-react";

export default function RoomGuestSelector({
  openRoomguestselector,
  setOpenroomguestselector,
}) {
  return (
    <div className="max-w-xs bg-white shadow-xl">
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Room */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-md">Room</h3>
          </div>

          <div className="flex items-center border w-28 h-8 rounded-xl">
            <button className="w-10 h-5 flex items-center justify-center hover:bg-gray-100">
              <Minus size={16} />
            </button>

            <span className="w-10 text-center font-bold text-md">2</span>

            <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Adults */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Adults</h3>
          </div>

          <div className="flex items-center border rounded-xl w-28 h-8">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100">
              <Minus size={16} />
            </button>

            <span className="w-10 text-center font-bold text-md">3</span>

            <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Children */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Children</h3>

            <p className="text-sm text-gray-400">0 - 17 Years Old</p>
          </div>

          <div className="flex items-center border rounded-xl w-28 h-8">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100">
              <Minus size={16} />
            </button>

            <span className="w-10 text-center font-bold text-lg">0</span>

            <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-sm text-gray-500 leading-relaxed">
          Please provide right number of children along with their right age for
          best options and prices.
        </p>

        <hr />

        {/* Pets */}
        <div className="border rounded-xl p-2 flex justify-between items-start">
          <div className="flex gap-4">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded" />

            <div>
              <h4 className="font-semibold text-gray-800">
                Are you travelling with pets?
              </h4>

              {/* <p className="text-sm text-gray-500 mt-1">
                Selecting this option will show only pet-friendly properties.
                Please review the pet policies & applicable fees, if any.
              </p> */}
            </div>
          </div>

          <PawPrint size={34} className="text-gray-500 shrink-0" />
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t bg-gray-50 p-2 flex justify-end ">
        <button
          onClick={() => setOpenroomguestselector(false)}
          className="
          cursor-pointer
          bg-gradient-to-r
          from-sky-400
          to-blue-600
          hover:from-sky-500
          hover:to-blue-700
          text-white
          font-bold
          px-5
          py-1
          rounded-full
          shadow-lg
          transition-all
        "
        >
          APPLY
        </button>
      </div>
    </div>
  );
}

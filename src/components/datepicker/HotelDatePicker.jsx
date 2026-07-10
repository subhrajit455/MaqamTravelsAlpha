import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const HotelDatePicker = ({
  open,
  setOpen,
  selectedDate,
  setSelectedDate,
  type,
}) => {
  if (!open) return null;

  return (
    <div
      className="absolute top-full left-1/4  z-50 bg-white shadow-xl rounded-xl p-4 translate-x-3"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="font-bold mb-3">
        Select {type === "checkIn" ? "Check In" : "Check Out"}
      </h3>

      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          setOpen(false);
        }}
        inline
        minDate={new Date()}
      />
    </div>
  );
};

export default HotelDatePicker;

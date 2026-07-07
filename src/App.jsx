import Home from "./pages/Home";
import { Routes, Route } from "react-router-dom";
import Search from "./pages/Search";
import HotelDetails from "./pages/HotelDetails";
import HotelBookingDetails from "./pages/HotelBookingDetails";
import SelectedRoomInformation from "./pages/SelectedRoomInformation";
import Footer from "./components/Footer";
import Hotel from "./pages/Hotel";
import Flight from "./pages/Flight";
import Error from "./pages/Error";
import Registration from "./pages/Registration";
import Profile from "./pages/Profile";
import TermsAndConditions from "./pages/Terms&Conditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Contact from "./pages/Contact";
import BookingHelp from "./pages/BookingHelp";
import Resetpassword from "./pages/Resetpassword";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/details/:id" element={<HotelDetails />} />
        <Route path="/booking-details/:id" element={<HotelBookingDetails />} />
        <Route
          path="/selected-room-information"
          element={<SelectedRoomInformation />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/hotel" element={<Hotel />} />
        <Route path="/flight" element={<Flight />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking-help" element={<BookingHelp />} />
        <Route path="/resetpassword/:token" element={<Resetpassword />} />
        {/* <Route path ="/forgetpassword" element={<Forget />} /> */}
        <Route path="*" element={<Error />} />
      </Routes>

      <div className="relative">
        <div className="absolute top-100  w-full">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default App;

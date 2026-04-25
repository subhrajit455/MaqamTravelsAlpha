import { NavLink } from "react-router-dom";
import { FaXTwitter, FaFacebook } from "react-icons/fa6";
import { AiFillInstagram } from "react-icons/ai";
import Logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="w-full overflow-hidden font-poppins">

      {/* Main Footer */}
      <div className="relative bg-teal-500 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 py-10 px-6">

          {/* Company Info */}
          <div>
            <NavLink to="/" className="flex items-center gap-2">
              <img src={Logo} alt="Maqam Travel Logo" className="w-32 mb-4" />
            </NavLink>

            <p className="mt-4 text-sm">
              Travel solutions for Religious Tour Plan.
            </p>

            <p className="mt-3 text-sm">
              +91 96090 92893 / 9635232042
            </p>

            <p className="text-sm">info@qammaqam.com</p>
            <p className="text-sm">maqamholidaypvtltd@gmail.com</p>

            <div className="flex gap-4 mt-4">
              <FaXTwitter size={18} />
              <FaFacebook size={18} />
              <AiFillInstagram size={18} />
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-medium text-lg mb-4 text-center">Explore</h3>
            <ul className="space-y-2 text-sm text-center">
              <li>
                <NavLink to="/flight" className="hover:text-yellow-300">
                  Flights
                </NavLink>
              </li>

              <li>
                <NavLink to="/hotel" className="hover:text-yellow-300">
                  Hotels
                </NavLink>
              </li>

              <li>
                <NavLink to="/tour-packages" className="hover:text-yellow-300">
                  Tour Packages
                </NavLink>
              </li>

              <li>
                <NavLink to="/offers" className="hover:text-yellow-300">
                  Special Offers
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-medium text-lg mb-4 text-center">Support</h3>
            <ul className="space-y-2 text-sm text-center">

              <li>
                <NavLink to="/guidelines" className="hover:text-yellow-300">
                  Islamic Travel Guidelines
                </NavLink>
              </li>

              <li>
                <NavLink to="/booking-help" className="hover:text-yellow-300">
                  Booking Help
                </NavLink>
              </li>

              <li>
                <NavLink to="/contact" className="hover:text-yellow-300">
                  Contact Us
                </NavLink>
              </li>

              <li>
                <NavLink to="/privacy-policy" className="hover:text-yellow-300">
                  Privacy Policy
                </NavLink>
              </li>

              <li>
                <NavLink to="/terms" className="hover:text-yellow-300">
                  Terms of Service
                </NavLink>
              </li>

            </ul>
          </div>

          {/* Stay Connected */}
          <div className="relative">
            <div className="hidden md:block absolute -top-50 -right-120 w-[800px] h-[800px] bg-[#F6F4EF] rounded-full"></div>

            <div className="relative text-center md:text-right">
              <h3 className="text-2xl font-normal md:text-gray-800 text-white">
                Stay Connected<span className="text-teal-600">...</span>
              </h3>

              <p className="text-sm md:text-gray-700 text-white mt-2">
                Get travel deals, Umrah promotions, halal hotel discounts,
                and new Muslim destinations.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  placeholder="Please Enter Your Mail..."
                  className="px-3 py-2 rounded-md border md:border-teal-400 text-sm text-gray-700 w-full border-yellow-400 placeholder-white md:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />

                <button className="bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#F6F4EF] text-center text-sm py-2 px-2 md:px-6 text-gray-700">
        © {new Date().getFullYear()} Maqam Holidays pvt.Ltd. <br/> Designed & Developed By <a href="https://www.vais.co.in/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
          VAIS Engineering Private Limited
        </a>
      </div>

    </footer>
  );
}
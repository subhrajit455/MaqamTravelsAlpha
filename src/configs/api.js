export const SearchAPI= {
  SearchApi: `${import.meta.env.VITE_API_URL_S}/api/hotels`,
  SearchAllDataApi: `${import.meta.env.VITE_API_URL_S}/api/hotels/search`,
};
export const HotelDetailsAPI={
  HotelDetailsApi  :`${import.meta.env.VITE_API_URL_S}/api/hotels/details`,
  HotelRoomAvailabilityApi :`${import.meta.env.VITE_API_URL_S}/api/hotels/room`,
  HotelRoomPreorderApi :`${import.meta.env.VITE_API_URL_S}/api/hotels/preorder`,
  HotelRoomAllDataApi :`${import.meta.env.VITE_API_URL_S}/api/hotels/all`,
}
export const UserAPI={
  UserRegisterApi : `${import.meta.env.VITE_API_URL_S}/api/customers/register`,
  UserLoginApi : `${import.meta.env.VITE_API_URL_S}/api/customers/login`,
  UserProfileApi : `${import.meta.env.VITE_API_URL_S}/api/customers/profile`,
  UserForgetPasswordApi : `${import.meta.env.VITE_API_URL_S}/api/customers/forgotpassword`,
  UserResetPasswordApi : `${import.meta.env.VITE_API_URL_S}/api/customers/resetpassword`,
  userUpdateProfileApi : `${import.meta.env.VITE_API_URL_S}/api/customers`,
  userEnquiryApi : `${import.meta.env.VITE_API_URL_S}/api/customers/changepassword`,
}

export const FlightAPI={
  FlightCitySearchApi : `${import.meta.env.VITE_API_URL_S}/api/flights/iata`,
  FlightAccessApi : `${import.meta.env.VITE_API_URL_S}/api/flights/access`,
  FlightSearchApi : `${import.meta.env.VITE_API_URL_S}/api/flights`,
  FlightPriceConfirmationApi : `${import.meta.env.VITE_API_URL_S}/api/flights/confirmation`,
}


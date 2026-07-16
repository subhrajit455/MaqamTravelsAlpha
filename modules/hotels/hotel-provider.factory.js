const { assertHotelProvider } = require('../../providers/hotels/contracts/hotel-provider.contract');

const providers = {
  mock: () => require('../../providers/hotels/mock/mock-hotel.provider'),
  srdv: () => require('../../providers/hotels/srdv/srdv-hotel.provider'),
};

const getHotelProvider = () => {
  const name = (process.env.HOTEL_PROVIDER || 'mock').toLowerCase();
  if (!providers[name]) throw new Error(`Unsupported HOTEL_PROVIDER: ${name}`);
  return assertHotelProvider(providers[name](), name);
};

module.exports = { getHotelProvider };

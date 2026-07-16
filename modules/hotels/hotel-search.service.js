const crypto = require('crypto');
const cache = require('../../utils/chache');
const { AppError } = require('../../middleware/errorHandler');
const { getHotelProvider } = require('./hotel-provider.factory');
const { SEARCH_CACHE_TTL_MS, RECHECK_CACHE_TTL_MS } = require('./hotel.constants');

const searchHotels = async (criteria) => {
  const provider = getHotelProvider();
  const result = await provider.searchHotels(criteria);
  const searchId = crypto.randomUUID();
  cache.set(`hotel:search:${searchId}`, { criteria, provider: result.provider, traceId: result.traceId, hotels: result.hotels }, SEARCH_CACHE_TTL_MS);
  return { searchId, expiresInSeconds: SEARCH_CACHE_TTL_MS / 1000, hotels: result.hotels };
};

const getSearch = (searchId) => {
  const search = cache.get(`hotel:search:${searchId}`);
  if (!search) throw new AppError('Search session expired. Please search again.', 410);
  return search;
};

const getHotelDetails = async ({ searchId, hotelId }) => {
  const search = getSearch(searchId);
  if (!search.hotels.some((hotel) => hotel.id === hotelId)) throw new AppError('Hotel is not part of this search.', 400);
  return getHotelProvider().getHotelDetails({ hotelId, ...search.criteria });
};

const recheck = async ({ searchId, hotelId, selectedRooms, mockScenario }) => {
  const search = getSearch(searchId);
  if (!search.hotels.some((hotel) => hotel.id === hotelId)) throw new AppError('Hotel is not part of this search.', 400);
  const scenario = mockScenario || search.criteria.mockScenario;
  const providerResult = await getHotelProvider().blockRoom({ hotelId, selectedRooms, mockScenario: scenario, ...search.criteria });
  const recheckId = crypto.randomUUID();
  cache.set(`hotel:recheck:${recheckId}`, { searchId, hotelId, search, providerResult, mockScenario: scenario }, RECHECK_CACHE_TTL_MS);
  return { recheckId, expiresInSeconds: RECHECK_CACHE_TTL_MS / 1000, ...providerResult };
};

const getRecheck = (recheckId) => {
  const recheck = cache.get(`hotel:recheck:${recheckId}`);
  if (!recheck) throw new AppError('Recheck session expired. Please recheck the selected room.', 410);
  return recheck;
};

module.exports = { searchHotels, getHotelDetails, recheck, getSearch, getRecheck };

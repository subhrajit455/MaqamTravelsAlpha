'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const mapper = require('../../providers/hotels/srdv/srdv-hotel.mapper');

const criteria = {
  cityId: '13044', // SRDV city ID
  countryCode: 'SA',
  checkIn: new Date('2026-10-14'),
  checkOut: new Date('2026-10-18'),
  guestNationality: 'IN',
  currency: 'INR',
  rooms: [{ adults: 2, children: 0, childAges: [] }],
};

test('SRDV hotel mapper builds correct Search request structure', () => {
  const result = mapper.mapSearchRequest(criteria);

  assert.equal(result.BookingMode, 5);
  assert.equal(result.NoOfNights, 4);
  assert.equal(result.CityId, 13044);
  assert.equal(result.GuestNationality, 'IN');
  assert.equal(result.NoOfRooms, 1);
  assert.equal(result.RoomGuests[0].NoOfAdults, 2);
});

test('SRDV hotel mapper resolves cityName "Mumbai" to correct cityId', () => {
  const criteriaByName = {
    cityName: 'Mumbai',
    countryCode: 'IN',
    checkIn: new Date('2026-10-14'),
    checkOut: new Date('2026-10-18'),
    guestNationality: 'IN',
    currency: 'INR',
    rooms: [{ adults: 2, children: 0, childAges: [] }],
  };
  const result = mapper.mapSearchRequest(criteriaByName);
  assert.equal(result.CityId, 13044, 'Mumbai should resolve to cityId 13044');
});

test('SRDV hotel mapper resolves cityName alias "Bombay" to correct cityId', () => {
  const criteriaByAlias = {
    cityName: 'Bombay',
    countryCode: 'IN',
    checkIn: new Date('2026-10-14'),
    checkOut: new Date('2026-10-18'),
    guestNationality: 'IN',
    currency: 'INR',
    rooms: [{ adults: 2, children: 0, childAges: [] }],
  };
  const result = mapper.mapSearchRequest(criteriaByAlias);
  assert.equal(result.CityId, 13044, 'Bombay alias should resolve to cityId 13044 (Mumbai)');
});

test('SRDV hotel mapper resolves cityName "Makkah" correctly', () => {
  const criteriaMakkah = {
    cityName: 'Makkah',
    countryCode: 'SA',
    checkIn: new Date('2026-10-14'),
    checkOut: new Date('2026-10-18'),
    guestNationality: 'IN',
    currency: 'INR',
    rooms: [{ adults: 2, children: 0, childAges: [] }],
  };
  const result = mapper.mapSearchRequest(criteriaMakkah);
  assert.equal(result.CityId, 128960, 'Makkah should resolve to cityId 128960');
  assert.equal(result.CountryCode, 'SA');
});

test('SRDV hotel mapper throws AppError for unknown cityName', () => {
  const criteriaUnknown = {
    cityName: 'UnknownCityXYZ',
    countryCode: 'IN',
    checkIn: new Date('2026-10-14'),
    checkOut: new Date('2026-10-18'),
    guestNationality: 'IN',
    currency: 'INR',
    rooms: [{ adults: 2, children: 0, childAges: [] }],
  };
  assert.throws(
    () => mapper.mapSearchRequest(criteriaUnknown),
    (err) => {
      assert.ok(err.message.includes('UnknownCityXYZ'), 'Error should mention the unknown city name');
      return true;
    },
    'Should throw when cityName is not in the city map',
  );
});

test('SRDV hotel mapper correctly parses raw Search responses', () => {
  const mockSrdvResponse = {
    TraceId: 'test-trace-uuid',
    SrdvType: 'test-srdv-type',
    HotelSearchResult: {
      HotelResults: [
        {
          HotelCode: 'SRDV_H1',
          HotelName: 'Test Hotel Makkah',
          StarRating: 4,         // SRDV uses StarRating, not Rating
          HotelAddress: 'Address 123',
          MinPrice: 1500,        // Major units (INR), per-night
          CurrencyCode: 'INR',
        }
      ]
    }
  };

  const normalized = mapper.mapSearchResponse(mockSrdvResponse, criteria);

  assert.equal(normalized.provider, 'srdv');
  assert.equal(normalized.traceId, 'test-trace-uuid');
  assert.equal(normalized.hotels.length, 1);
  assert.equal(normalized.hotels[0].id, 'SRDV_H1');
  assert.equal(normalized.hotels[0].name, 'Test Hotel Makkah');
  assert.equal(normalized.hotels[0].rating, 4, 'StarRating should be mapped correctly');
  // Mapper now returns PER-NIGHT price in minor units (no nights multiplication).
  // MinPrice 1500 INR × 100 = 150000 paise.
  // The use-case multiplies by nights when applying markup.
  assert.equal(normalized.hotels[0].fromPrice.amountMinor, 150000);
});

test('SRDV hotel mapper handles cancellations response mapping', () => {
  const mockSrdvResponse = {
    CancelResult: {
      RefundStatus: 'Refunded',
      CancellationRefNo: 'CANCELED_REF_123',
      CancellationCharges: 300,
    }
  };

  const normalized = mapper.mapCancelResponse(mockSrdvResponse);
  assert.equal(normalized.status, 'cancelled');
  assert.equal(normalized.cancellationReference, 'CANCELED_REF_123');
  assert.equal(normalized.penalty, 300);
});

test('hotel search exposes both supplier price and selling price', async () => {
  const originalLoad = Module._load;
  const stubCache = {
    set: async () => { },
    get: async () => null,
  };
  const stubProvider = {
    searchHotels: async () => ({
      traceId: 'trace-1',
      srdvType: 'srdv-type',
      hotels: [{
        id: 'H1',
        name: 'Test Hotel',
        // amountMinor is now per-night supplier price in paise (mapper fix)
        fromPrice: { amountMinor: 400000, currency: 'INR' },
      }],
      _raw: [{ HotelCode: 'H1', HotelName: 'Test Hotel' }],
    }),
  };

  process.env.HOTEL_MARKUP_PERCENT = '10';
  process.env.HOTEL_CONVENIENCE_FEE_INR = '0';

  Module._load = function (request, parent, isMain) {
    if (request === '../../../utils/cache') return stubCache;
    if (request === '../hotel-provider.factory') return { getHotelProvider: () => stubProvider };
    return originalLoad.apply(this, arguments);
  };

  delete require.cache[require.resolve('../../modules/hotels/application/hotel-search.usecase')];
  const { searchHotels } = require('../../modules/hotels/application/hotel-search.usecase');

  try {
    // 4 nights (2026-10-14 → 2026-10-18)
    const result = await searchHotels({
      checkIn: '2026-10-14',
      checkOut: '2026-10-18',
      currency: 'INR',
      rooms: [{ adults: 2, children: 0, childAges: [] }],
    });

    // Use-case: markup applied per-night, then multiplied by 4 nights.
    // Per-night supplier = 400000 paise. With 10% markup = 440000/night.
    // Over 4 nights: supplier total = 400000 × 4 = 1,600,000; customer total = 440000 × 4 = 1,760,000
    assert.equal(result.nights, 4, 'nights should be 4');
    assert.equal(result.hotels[0].fromPrice.nights, 4, 'fromPrice.nights should be 4');
    assert.equal(result.hotels[0].fromPrice.supplierAmountMinor, 1600000,
      'supplierAmountMinor should be per-night (400000) × 4 nights');
    assert.equal(result.hotels[0].fromPrice.customerTotalMinor, 1760000,
      'customerTotalMinor should be (400000 × 1.10) × 4 nights = 1,760,000');
    // perNightPrice is the selling price per night in major units
    assert.equal(result.hotels[0].fromPrice.perNightPrice, 4400.00,
      'perNightPrice should be 440000 paise / 100 = 4400 INR/night');
  } finally {
    Module._load = originalLoad;
    delete require.cache[require.resolve('../../modules/hotels/application/hotel-search.usecase')];
  }
});

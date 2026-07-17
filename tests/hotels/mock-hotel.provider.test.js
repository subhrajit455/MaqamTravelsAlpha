'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
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

test('SRDV hotel mapper correctly parses raw Search responses', () => {
  const mockSrdvResponse = {
    TraceId: 'test-trace-uuid',
    SrdvType: 'test-srdv-type',
    HotelSearchResult: {
      HotelResults: [
        {
          HotelCode: 'SRDV_H1',
          HotelName: 'Test Hotel Makkah',
          Rating: 4,
          HotelAddress: 'Address 123',
          MinPrice: 1500,
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
  // MinPrice (1500) * nights (4) * 100 to convert to paise (minor units) = 600000 paise
  assert.equal(normalized.hotels[0].fromPrice.amountMinor, 600000);
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

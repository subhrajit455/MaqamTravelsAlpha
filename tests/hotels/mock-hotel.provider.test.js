const test = require('node:test');
const assert = require('node:assert/strict');
const provider = require('../../providers/hotels/mock/mock-hotel.provider');

const criteria = {
  cityId: 'MAK', countryCode: 'SA', checkIn: '2026-10-14', checkOut: '2026-10-18',
  rooms: [{ adults: 2, children: 0 }],
};

test('mock hotel provider returns hotel availability and a stable block', async () => {
  const search = await provider.searchHotels(criteria);
  assert.equal(search.provider, 'mock');
  assert.ok(search.hotels.length > 0);

  const block = await provider.blockRoom({
    ...criteria, hotelId: search.hotels[0].id, selectedRooms: [{ roomId: 'deluxe-king' }],
  });
  assert.equal(block.priceChanged, false);
  assert.equal(block.price.currency, 'INR');
  assert.ok(block.price.total > 0);
});

test('mock hotel provider exposes supplier recheck outcomes', async () => {
  const changed = await provider.blockRoom({
    ...criteria, hotelId: 'mock-makkah-001', selectedRooms: [{ roomId: 'deluxe-king' }], mockScenario: 'price_changed',
  });
  assert.equal(changed.priceChanged, true);

  const pending = await provider.book({ booking: {}, mockScenario: 'provider_pending' });
  assert.equal(pending.status, 'pending');
});

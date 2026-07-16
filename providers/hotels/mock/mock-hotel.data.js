module.exports = [
  {
    id: 'mock-makkah-001', cityId: 'MAK', countryCode: 'SA', name: 'Mock Grand Makkah',
    rating: 5, address: 'Ibrahim Al Khalil Road, Makkah', amenities: ['WiFi', 'Breakfast', 'Airport transfer'],
    rooms: [
      { id: 'deluxe-king', name: 'Deluxe King Room', board: 'Breakfast included', capacity: 2, price: 7800, refundable: true, cancellationPolicy: 'Free cancellation until 72 hours before check-in.' },
      { id: 'family-suite', name: 'Family Suite', board: 'Breakfast included', capacity: 4, price: 12800, refundable: true, cancellationPolicy: 'Free cancellation until 7 days before check-in.' },
    ],
  },
  {
    id: 'mock-madinah-001', cityId: 'MED', countryCode: 'SA', name: 'Mock Madinah Residency',
    rating: 4, address: 'Northern Central Area, Madinah', amenities: ['WiFi', 'Restaurant', 'Prayer area'],
    rooms: [
      { id: 'standard-twin', name: 'Standard Twin Room', board: 'Room only', capacity: 2, price: 5100, refundable: false, cancellationPolicy: 'Non-refundable after booking.' },
      { id: 'premium-quad', name: 'Premium Quad Room', board: 'Breakfast included', capacity: 4, price: 9200, refundable: true, cancellationPolicy: 'Free cancellation until 48 hours before check-in.' },
    ],
  },
];

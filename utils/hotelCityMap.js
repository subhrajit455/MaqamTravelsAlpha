'use strict';

/**
 * utils/hotelCityMap.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Static mapping of popular city names to SRDV CityId values.
 *
 * SRDV uses a proprietary numeric CityId (inherited from TBO) — not IATA codes.
 * This map allows users to search hotels by city name instead of remembering
 * numeric IDs.
 *
 * Structure:
 *   { cityName (canonical), cityId (string), countryCode (ISO-2), aliases[] }
 *
 * How to extend:
 *   Add an entry to CITY_LIST below. Aliases cover alternate spellings / local
 *   names. Both canonical name and all aliases are matched during search.
 */

const CITY_LIST = [
  // ── Saudi Arabia ──────────────────────────────────────────────────────────
  { cityName: 'Makkah',   cityId: '128960', countryCode: 'SA', aliases: ['Mecca', 'Makkah al-Mukarramah', 'Makka'] },
  { cityName: 'Madinah',  cityId: '128961', countryCode: 'SA', aliases: ['Medina', 'Al Madinah', 'Madina', 'Al Madinah Al Munawwarah'] },
  { cityName: 'Riyadh',   cityId: '128962', countryCode: 'SA', aliases: ['Riyad'] },
  { cityName: 'Jeddah',   cityId: '128963', countryCode: 'SA', aliases: ['Jiddah', 'Jidda'] },
  { cityName: 'Taif',     cityId: '128964', countryCode: 'SA', aliases: ['At Taif', 'Taif City'] },
  { cityName: 'Dammam',   cityId: '128965', countryCode: 'SA', aliases: ['Al Dammam'] },

  // ── United Arab Emirates ──────────────────────────────────────────────────
  { cityName: 'Dubai',        cityId: '100896', countryCode: 'AE', aliases: ['Dubayy'] },
  { cityName: 'Abu Dhabi',    cityId: '100897', countryCode: 'AE', aliases: ['Abu Zaby', 'Abudhabi'] },
  { cityName: 'Sharjah',      cityId: '100898', countryCode: 'AE', aliases: ['Ash Shariqah'] },
  { cityName: 'Ajman',        cityId: '100899', countryCode: 'AE', aliases: [] },
  { cityName: 'Ras Al Khaimah', cityId: '100900', countryCode: 'AE', aliases: ['RAK', 'Ras al-Khaimah'] },

  // ── India — Metro cities ───────────────────────────────────────────────────
  { cityName: 'Delhi',      cityId: '725862', countryCode: 'IN', aliases: ['New Delhi', 'NCR', 'National Capital Region'] },
  { cityName: 'Mumbai',     cityId: '13044',  countryCode: 'IN', aliases: ['Bombay', 'Bombay City'] },
  { cityName: 'Bangalore',  cityId: '695939', countryCode: 'IN', aliases: ['Bengaluru', 'Bengalore', 'Bengalore'] },
  { cityName: 'Hyderabad',  cityId: '694553', countryCode: 'IN', aliases: ['Cyberabad', 'Hyd'] },
  { cityName: 'Chennai',    cityId: '694554', countryCode: 'IN', aliases: ['Madras'] },
  { cityName: 'Kolkata',    cityId: '694555', countryCode: 'IN', aliases: ['Calcutta'] },
  { cityName: 'Ahmedabad',  cityId: '694556', countryCode: 'IN', aliases: ['Amdavad'] },
  { cityName: 'Pune',       cityId: '694557', countryCode: 'IN', aliases: ['Poona', 'Poon'] },
  { cityName: 'Jaipur',     cityId: '694558', countryCode: 'IN', aliases: ['Pink City'] },
  { cityName: 'Lucknow',    cityId: '694559', countryCode: 'IN', aliases: [] },
  { cityName: 'Kochi',      cityId: '694560', countryCode: 'IN', aliases: ['Cochin', 'Ernakulam'] },
  { cityName: 'Goa',        cityId: '694561', countryCode: 'IN', aliases: ['Panaji', 'Panjim', 'North Goa', 'South Goa'] },
  { cityName: 'Agra',       cityId: '694562', countryCode: 'IN', aliases: [] },
  { cityName: 'Varanasi',   cityId: '694563', countryCode: 'IN', aliases: ['Banaras', 'Benares', 'Kashi'] },
  { cityName: 'Amritsar',   cityId: '694564', countryCode: 'IN', aliases: [] },
  { cityName: 'Chandigarh', cityId: '694565', countryCode: 'IN', aliases: [] },
  { cityName: 'Surat',      cityId: '694566', countryCode: 'IN', aliases: [] },
  { cityName: 'Nagpur',     cityId: '694567', countryCode: 'IN', aliases: [] },
  { cityName: 'Patna',      cityId: '694568', countryCode: 'IN', aliases: [] },
  { cityName: 'Bhopal',     cityId: '694569', countryCode: 'IN', aliases: [] },
  { cityName: 'Indore',     cityId: '694570', countryCode: 'IN', aliases: [] },
  { cityName: 'Coimbatore', cityId: '694571', countryCode: 'IN', aliases: ['Kovai'] },
  { cityName: 'Mysore',     cityId: '694572', countryCode: 'IN', aliases: ['Mysuru'] },
  { cityName: 'Guwahati',   cityId: '694573', countryCode: 'IN', aliases: [] },
  { cityName: 'Bhubaneswar',cityId: '694574', countryCode: 'IN', aliases: [] },
  { cityName: 'Visakhapatnam', cityId: '694575', countryCode: 'IN', aliases: ['Vizag', 'Vishakapatnam'] },
  { cityName: 'Thiruvananthapuram', cityId: '694576', countryCode: 'IN', aliases: ['Trivandrum', 'TVM'] },
  { cityName: 'Udaipur',    cityId: '694577', countryCode: 'IN', aliases: ['Lake City'] },
  { cityName: 'Jodhpur',    cityId: '694578', countryCode: 'IN', aliases: ['Blue City'] },
  { cityName: 'Shimla',     cityId: '694579', countryCode: 'IN', aliases: [] },
  { cityName: 'Manali',     cityId: '694580', countryCode: 'IN', aliases: [] },
  { cityName: 'Ooty',       cityId: '694581', countryCode: 'IN', aliases: ['Udhagamandalam'] },
  { cityName: 'Darjeeling', cityId: '694582', countryCode: 'IN', aliases: [] },

  // ── Other Middle East / Asia ───────────────────────────────────────────────
  { cityName: 'Doha',        cityId: '130001', countryCode: 'QA', aliases: ['Ad Dawhah'] },
  { cityName: 'Kuwait City', cityId: '130002', countryCode: 'KW', aliases: ['Al Kuwayt'] },
  { cityName: 'Muscat',      cityId: '130003', countryCode: 'OM', aliases: ['Masqat'] },
  { cityName: 'Bahrain',     cityId: '130004', countryCode: 'BH', aliases: ['Manama', 'Al Manama'] },
  { cityName: 'Colombo',     cityId: '130005', countryCode: 'LK', aliases: [] },
  { cityName: 'Dhaka',       cityId: '130006', countryCode: 'BD', aliases: ['Dacca'] },
  { cityName: 'Karachi',     cityId: '130007', countryCode: 'PK', aliases: [] },
  { cityName: 'Lahore',      cityId: '130008', countryCode: 'PK', aliases: [] },
  { cityName: 'Islamabad',   cityId: '130009', countryCode: 'PK', aliases: [] },
  { cityName: 'Kathmandu',   cityId: '130010', countryCode: 'NP', aliases: [] },
  { cityName: 'Istanbul',    cityId: '130011', countryCode: 'TR', aliases: ['Constantinople'] },
  { cityName: 'Kuala Lumpur',cityId: '130012', countryCode: 'MY', aliases: ['KL'] },
  { cityName: 'Singapore',   cityId: '130013', countryCode: 'SG', aliases: [] },
  { cityName: 'Bangkok',     cityId: '130014', countryCode: 'TH', aliases: ['Krung Thep'] },
  { cityName: 'Bali',        cityId: '130015', countryCode: 'ID', aliases: ['Denpasar'] },
  { cityName: 'Cairo',       cityId: '130016', countryCode: 'EG', aliases: ['Al Qahirah'] },
];

/**
 * Build a flat lookup index for O(1) cityId-to-city access
 */
const CITY_BY_ID = {};
for (const city of CITY_LIST) {
  CITY_BY_ID[String(city.cityId)] = city;
}

/**
 * Build a flat alias index: lowercase alias/name → city entry
 * Used for fast case-insensitive exact lookups in resolveCityId()
 */
const ALIAS_INDEX = {};
for (const city of CITY_LIST) {
  ALIAS_INDEX[city.cityName.toLowerCase()] = city;
  for (const alias of city.aliases) {
    ALIAS_INDEX[alias.toLowerCase()] = city;
  }
}

/**
 * Resolve a city name (or alias) to its SRDV cityId string.
 * Exact match first, then falls back to partial match.
 *
 * @param {string} cityName  - User-supplied city name
 * @returns {string|null}    - SRDV cityId string, or null if not found
 */
const resolveCityId = (cityName) => {
  if (!cityName || typeof cityName !== 'string') return null;
  const normalized = cityName.trim().toLowerCase();
  if (!normalized) return null;

  // 1. Exact match (fastest path)
  if (ALIAS_INDEX[normalized]) return ALIAS_INDEX[normalized].cityId;

  // 2. Partial match — find first entry where canonical name or any alias starts with the query
  const partial = CITY_LIST.find((c) => {
    if (c.cityName.toLowerCase().startsWith(normalized)) return true;
    return c.aliases.some((a) => a.toLowerCase().startsWith(normalized));
  });
  return partial ? partial.cityId : null;
};

/**
 * Search cities by a partial query string (for autocomplete).
 * Matches against canonical name AND all aliases.
 *
 * @param {string} query     - Partial city name typed by user (e.g., "mum", "mak")
 * @param {number} [limit]   - Maximum number of results (default 10)
 * @returns {{ cityName: string, cityId: string, countryCode: string }[]}
 */
const searchCities = (query, limit = 10) => {
  if (!query || typeof query !== 'string') return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const results = [];
  for (const city of CITY_LIST) {
    if (results.length >= limit) break;
    const nameMatch = city.cityName.toLowerCase().includes(normalized);
    const aliasMatch = city.aliases.some((a) => a.toLowerCase().includes(normalized));
    if (nameMatch || aliasMatch) {
      results.push({
        cityName: city.cityName,
        cityId: city.cityId,
        countryCode: city.countryCode,
      });
    }
  }
  return results;
};

/**
 * Reverse lookup — find city by its SRDV cityId.
 *
 * @param {string|number} cityId
 * @returns {{ cityName: string, cityId: string, countryCode: string }|null}
 */
const findCityById = (cityId) => {
  if (!cityId) return null;
  const entry = CITY_BY_ID[String(cityId)];
  if (!entry) return null;
  return { cityName: entry.cityName, cityId: entry.cityId, countryCode: entry.countryCode };
};

/**
 * Returns all cities (for a complete list endpoint).
 *
 * @returns {{ cityName: string, cityId: string, countryCode: string }[]}
 */
const getAllCities = () =>
  CITY_LIST.map((c) => ({ cityName: c.cityName, cityId: c.cityId, countryCode: c.countryCode }));

module.exports = { resolveCityId, searchCities, findCityById, getAllCities };

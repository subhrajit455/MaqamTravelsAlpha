// utils/cache.js
// In-memory now; swap internals for ioredis later without changing the interface below.
const store = new Map();

const set = (key, value, ttlMs) => {
  const expiresAt = Date.now() + ttlMs;
  store.set(key, { value, expiresAt });
};

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};
// const getAll = () => {
//   const now = Date.now();
//   const validData = [];

//   for (const [key, entry] of store.entries()) {
//     if (now > entry.expiresAt) {
//       store.delete(key); // Clear expired data
//     } else {
//       validData.push(entry.value); // Keep active data
//     }
//   }

//   return validData; // Returns empty array [] if no data available
// };

module.exports = { set, get};
'use strict';

/**
 * modules/hotels/application/pricing.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuration-driven markup placeholder as pricing engine.
 * Calculates customer selling prices in integer minor units (paise for INR).
 */

const calculateSellingPrice = (supplierAmountMinor, currency = 'INR') => {
  const markupPercent = parseFloat(process.env.HOTEL_MARKUP_PERCENT || '8');
  const convenienceFeeInr = parseFloat(process.env.HOTEL_CONVENIENCE_FEE_INR || '200');

  // Supplier price in paise
  const supplierPaise = Math.round(supplierAmountMinor);

  // Markup amount
  const markupPaise = Math.round(supplierPaise * (markupPercent / 100));

  // Flat convenience fee (only if currency is INR, else convert or omit)
  const feePaise = currency === 'INR' ? Math.round(convenienceFeeInr * 100) : 0;

  // Final selling price
  const customerTotalMinor = supplierPaise + markupPaise + feePaise;

  return {
    supplierAmountMinor: supplierPaise,
    markupMinor: markupPaise,
    feeMinor: feePaise,
    discountMinor: 0,
    customerTotalMinor,
    currency,
    pricingVersion: `env-p${markupPercent}-f${convenienceFeeInr}-v1`,
  };
};

module.exports = { calculateSellingPrice };

'use strict';

/**
 * providers/hotels/srdv/srdv-hotel.client.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Raw HTTP client for SRDV Hotel API v8.
 * Authenticates using JSON payload credentials and optionally X-API-Key header.
 */

const axios = require('axios');
const logger = require('../../../utils/logger');
const { AppError } = require('../../../middleware/errorHandler');

const SRDV_HOTEL_BASE_URL = process.env.SRDV_API_BASE_HOTEL_URL || 'https://hotel.srdvtest.com/v8/rest';
const SRDV_API_TOKEN = process.env.SRDV_API_TOKEN || process.env.SRDV_API_KEY || '';

// Clean up token if it has comments/whitespace from .env
const cleanToken = SRDV_API_TOKEN.replace(/\(.*\)/g, '').trim();
const normalizedBaseURL = `${SRDV_HOTEL_BASE_URL.replace(/\/+$/, '')}/`;

const client = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
    ...(cleanToken ? { 'X-API-Key': cleanToken } : {}),
  },
  timeout: 30000, // 30s timeout for downstream partner calls
});

// Some SRDV test setups expect the token under the 'Api-Token' header name.
// Send both headers when a token is present to maximize compatibility.
if (cleanToken) {
  client.defaults.headers['Api-Token'] = cleanToken;
}

// Non-sensitive debug: log whether an API key header will be sent (do not log the token itself)
logger.info(`[SRDV Hotel Client] API key header presence: ${cleanToken ? 'present' : 'missing'}`);

/**
 * Helper to build the credentials block expected in every SRDV request payload
 */
const getCredentials = () => ({
  EndUserIp: process.env.SRDV_END_USER_IP || '1.1.1.1',
  ClientId: process.env.SRDV_CLIENT_ID || '',
  UserName: process.env.SRDV_USERNAME || '',
  Password: process.env.SRDV_PASSWORD || '',
});

/**
 * Generic POST wrapper with error handling and request logging
 */
const postRequest = async (path, body, correlationId = '') => {
  const payload = {
    ...getCredentials(),
    ...body,
  };

  const redactPayload = (data) => {
    if (!data) return data;
    const cloned = JSON.parse(JSON.stringify(data));
    if (cloned.Password) cloned.Password = '***';
    return cloned;
  };

  logger.info(`[SRDV Hotel Client] [${correlationId}] POST ${path} payload: ${JSON.stringify(redactPayload(payload))}`);
  const startTime = Date.now();

  try {
    const normalizedPath = path.replace(/^\/+/, '');
    const response = await client.post(normalizedPath, payload);
    const duration = Date.now() - startTime;
    logger.info(`[SRDV Hotel Client] [${correlationId}] Response from POST /${normalizedPath} status ${response.status} in ${duration}ms`);
    const data = response.data;

    const wrapperKeys = [
      'GetHotelRoomResult',
      'HotelRoomResult',
      'GetHotelInfoResult',
      'HotelInfoResult',
      'BlockRoomResult',
      'BookResult',
      'CancelResult',
    ];

    const wrapper = wrapperKeys.reduce((result, key) => result || data[key], null) || data;
    const errorPayload = wrapper?.Error;
    if (errorPayload) {
      if (errorPayload.ErrorCode === 0) {
        logger.info(`[SRDV Hotel Client] [${correlationId}] SRDV returned ErrorCode 0; treating as non-fatal response.`);
        return data;
      }

      logger.error(`[SRDV Hotel Client] [${correlationId}] SRDV returned error: ${JSON.stringify(errorPayload)}`);
      throw new AppError(`SRDV Hotel API error: ${errorPayload.ErrorMessage || JSON.stringify(errorPayload)}`, 502);
    }

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error.response
      ? `status ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;

    logger.error(`[SRDV Hotel Client] [${correlationId}] POST ${path} failed after ${duration}ms: ${errorMsg}`);
    throw new AppError(`SRDV Hotel API error during ${path}: ${error.message}`, 502);
  }
};

module.exports = {
  search: (body, correlationId) => postRequest('/Search', body, correlationId),
  hotelInfo: (body, correlationId) => postRequest('/GetHotelInfo', body, correlationId),
  hotelRoom: (body, correlationId) => postRequest('/GetHotelRoom', body, correlationId),
  blockRoom: (body, correlationId) => postRequest('/BlockRoom', body, correlationId),
  book: (body, correlationId) => postRequest('/Book', body, correlationId),
  hotelBookingDetail: (body, correlationId) => postRequest('/HotelBookingDetail', body, correlationId),
  hotelCancel: (body, correlationId) => postRequest('/HotelCancel', body, correlationId),
};

/**
 * AirNow.gov Data Loader
 * 
 * EPA AirNow provides real-time Air Quality Index (AQI) data.
 * API key required: https://docs.airnowapi.org/
 * 
 * Free tier: 500 requests/hour.
 */

var AIRNOW_BASE = 'https://www.airnowapi.org/aq';

/**
 * Get current AQI by bounding box (US-wide).
 * @param {string} apiKey - AirNow API key
 * @returns {Promise<Array>} array of AQI observations
 */
async function fetchAirNowByBbox(apiKey) {
  if (!apiKey) {
    console.warn('AirNow API key not set. Skipping AirNow data.');
    return [];
  }
  var params = new URLSearchParams({
    bbox: '-125.0,24.0,-66.0,50.0',
    dataType: 'AQI',
    format: 'application/json',
    API_KEY: apiKey,
  });
  try {
    var resp = await fetch(AIRNOW_BASE + '/observation/latLong/current/?' + params, {
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error('AirNow HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('AirNow fetch failed: ' + err.message);
    return [];
  }
}

/**
 * Get current AQI by zip code.
 */
async function fetchAirNowByZip(zipCode, apiKey) {
  if (!apiKey) return [];
  var params = new URLSearchParams({
    zipCode: zipCode,
    format: 'application/json',
    API_KEY: apiKey,
  });
  try {
    var resp = await fetch(AIRNOW_BASE + '/observation/zipCode/current/?' + params, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error('AirNow HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('AirNow fetch failed for ' + zipCode + ': ' + err.message);
    return [];
  }
}

/**
 * Get forecast AQI by bounding box.
 */
async function fetchAirNowForecast(apiKey) {
  if (!apiKey) return [];
  var params = new URLSearchParams({
    bbox: '-125.0,24.0,-66.0,50.0',
    dataType: 'AQI',
    format: 'application/json',
    API_KEY: apiKey,
  });
  try {
    var resp = await fetch(AIRNOW_BASE + '/forecast/latLong/current/?' + params, {
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error('AirNow HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('AirNow forecast fetch failed: ' + err.message);
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIRNOW_BASE, fetchAirNowByBbox, fetchAirNowByZip, fetchAirNowForecast };
}

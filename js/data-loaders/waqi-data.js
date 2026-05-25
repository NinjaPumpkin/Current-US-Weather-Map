/**
 * WAQI Data Loader
 * 
 * World Air Quality Index — direct API access.
 * API: https://aqicn.org/api/
 * 
 * Provides real-time AQI, forecasts, and station-level data.
 * Token required (free registration).
 */

var WAQI_BASE = 'https://api.waqi.info';

/**
 * Fetch US-wide AQI heatmap data.
 */
async function fetchUsHeatmap(token) {
  if (!token) {
    console.warn('WAQI token not set. Skipping heatmap data.');
    return null;
  }
  try {
    var resp = await fetch(WAQI_BASE + '/map/bounds/?latlng=24,-125,50,-66&networks=all&token=' + token, {
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error('WAQI HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('WAQI heatmap fetch failed: ' + err.message);
    return null;
  }
}

/**
 * Fetch AQI for a specific station by ID.
 */
async function fetchStationById(stationId, token) {
  if (!token) return null;
  try {
    var resp = await fetch(WAQI_BASE + '/feed/@' + stationId + '/?token=' + token, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error('WAQI HTTP ' + resp.status);
    var data = await resp.json();
    if (data.status !== 'ok') throw new Error('WAQI: ' + data.data);
    return data.data;
  } catch (err) {
    console.warn('WAQI station fetch failed for ' + stationId + ': ' + err.message);
    return null;
  }
}

/**
 * Fetch nearest station based on IP geolocation.
 */
async function fetchNearestStation(token) {
  if (!token) return null;
  try {
    var resp = await fetch(WAQI_BASE + '/feed/here/?token=' + token, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error('WAQI HTTP ' + resp.status);
    var data = await resp.json();
    if (data.status !== 'ok') throw new Error('WAQI: ' + data.data);
    return data.data;
  } catch (err) {
    console.warn('WAQI nearest station fetch failed: ' + err.message);
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WAQI_BASE, fetchUsHeatmap, fetchStationById, fetchNearestStation };
}

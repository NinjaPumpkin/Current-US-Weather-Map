/**
 * NASA EONET Disaster Events Data Loader
 * 
 * Earth Observatory Natural Event Tracker provides real-time
 * tracking of natural disasters: wildfires, storms, volcanoes, etc.
 * 
 * API: https://eonet.gsfc.nasa.gov/docs/v3
 * No API key required.
 */

var EONET_BASE = 'https://eonet.gsfc.nasa.gov/api/v3';

var CATEGORIES = {
  wildfires: 8,
  severeStorms: 10,
  volcanoes: 12,
  floods: 15,
  drought: 17,
  dustHaze: 18,
  landslides: 19,
  manmade: 20,
  seaLakeIce: 16,
  snow: 22,
  tempExtremes: 23,
  waterColor: 24,
};

/**
 * Fetch all current events.
 */
async function fetchAllEvents(status, limit) {
  status = status || 'open';
  limit = limit || 50;
  var params = new URLSearchParams({ status: status, limit: limit });
  try {
    var resp = await fetch(EONET_BASE + '/events?' + params, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error('EONET HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('EONET events fetch failed: ' + err.message);
    return { events: [] };
  }
}

/**
 * Fetch events by category.
 */
async function fetchEventsByCategory(categoryId, status, limit) {
  status = status || 'open';
  limit = limit || 30;
  var params = new URLSearchParams({ status: status, limit: limit });
  try {
    var resp = await fetch(EONET_BASE + '/categories/' + categoryId + '?' + params, {
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error('EONET HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('EONET category fetch failed: ' + err.message);
    return { events: [] };
  }
}

/**
 * Fetch wildfire events specifically.
 */
async function fetchWildfireEvents() {
  return fetchEventsByCategory(CATEGORIES.wildfires, 'open', 50);
}

/**
 * Fetch severe storm events.
 */
async function fetchSevereStormEvents() {
  return fetchEventsByCategory(CATEGORIES.severeStorms, 'open', 30);
}

/**
 * Fetch events near a geographic point.
 */
async function fetchEventsNearPoint(lat, lon, radius, status) {
  status = status || 'open';
  radius = radius || 500; // km
  var params = new URLSearchParams({ lat: lat, lon: lon, radius: radius, status: status });
  try {
    var resp = await fetch(EONET_BASE + '/events?' + params, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error('EONET HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('EONET near-point fetch failed: ' + err.message);
    return { events: [] };
  }
}

/**
 * Fetch events within US bounding box.
 */
async function fetchUsEvents() {
  var params = new URLSearchParams({
    status: 'open',
    limit: 100,
    bbox: '-125,24,-66,50',
  });
  try {
    var resp = await fetch(EONET_BASE + '/events?' + params, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error('EONET HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('EONET US events fetch failed: ' + err.message);
    return { events: [] };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EONET_BASE, CATEGORIES,
    fetchAllEvents, fetchEventsByCategory, fetchWildfireEvents,
    fetchSevereStormEvents, fetchEventsNearPoint, fetchUsEvents,
  };
}

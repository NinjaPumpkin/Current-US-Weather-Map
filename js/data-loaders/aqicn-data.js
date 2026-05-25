/**
 * WAQI/AQICN Data Loader
 * 
 * World Air Quality Index project provides real-time AQI for 130+ countries.
 * API: https://aqicn.org/api/
 * 
 * Free tier with token. Demo token available for testing.
 */

var AQICN_BASE = 'https://api.waqi.info';

/**
 * Fetch AQI for a city by name.
 * @param {string} city - city name (e.g., 'new york', 'los angeles')
 * @param {string} token - WAQI API token
 * @returns {Promise<object>} AQI data
 */
async function fetchAqicnByCity(city, token) {
  if (!token) {
    console.warn('AQICN token not set. Skipping AQICN data.');
    return null;
  }
  try {
    var resp = await fetch(AQICN_BASE + '/feed/' + encodeURIComponent(city) + '/?token=' + token, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error('AQICN HTTP ' + resp.status);
    var data = await resp.json();
    if (data.status !== 'ok') throw new Error('AQICN: ' + data.data);
    return data.data;
  } catch (err) {
    console.warn('AQICN fetch failed for ' + city + ': ' + err.message);
    return null;
  }
}

/**
 * Fetch AQI by geolocation.
 */
async function fetchAqicnByGeo(lat, lon, token) {
  if (!token) return null;
  try {
    var resp = await fetch(AQICN_BASE + '/feed/geo:' + lat + ';' + lon + '/?token=' + token, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error('AQICN HTTP ' + resp.status);
    var data = await resp.json();
    if (data.status !== 'ok') throw new Error('AQICN: ' + data.data);
    return data.data;
  } catch (err) {
    console.warn('AQICN fetch failed for geo ' + lat + ',' + lon + ': ' + err.message);
    return null;
  }
}

/**
 * Search for stations by keyword.
 */
async function searchAqicnStations(keyword, token) {
  if (!token) return [];
  try {
    var resp = await fetch(AQICN_BASE + '/search/?keyword=' + encodeURIComponent(keyword) + '&token=' + token, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error('AQICN HTTP ' + resp.status);
    var data = await resp.json();
    if (data.status !== 'ok') return [];
    return data.data;
  } catch (err) {
    console.warn('AQICN search failed: ' + err.message);
    return [];
  }
}

/**
 * Fetch AQI for multiple US cities in parallel.
 */
async function fetchAqicnMultipleCities(token) {
  var cities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'miami', 'seattle', 'denver'];
  var promises = cities.map(function(city) {
    return fetchAqicnByCity(city, token)
      .then(function(data) { return { city: city, data: data }; })
      .catch(function(err) { return { city: city, error: err.message }; });
  });
  return Promise.all(promises);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AQICN_BASE, fetchAqicnByCity, fetchAqicnByGeo, searchAqicnStations, fetchAqicnMultipleCities };
}

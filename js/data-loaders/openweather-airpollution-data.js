/**
 * OpenWeather Air Pollution Data Loader
 * 
 * Provides Air Quality Index and pollutant concentrations.
 * API: https://openweathermap.org/api/air-pollution
 * 
 * Free tier: 60 calls/min. API key required.
 */

var OW_AIR_BASE = 'https://api.openweathermap.org/data/2.5/air_pollution';

var POLLUTANT_LABELS = {
  co: 'CO (Carbon Monoxide)',
  no: 'NO (Nitrogen Monoxide)',
  no2: 'NO2 (Nitrogen Dioxide)',
  o3: 'O3 (Ozone)',
  so2: 'SO2 (Sulfur Dioxide)',
  pm2_5: 'PM2.5 (Fine Particles)',
  pm10: 'PM10 (Coarse Particles)',
  nh3: 'NH3 (Ammonia)',
};

var AQI_LABELS = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

/**
 * Fetch current air pollution data.
 */
async function fetchCurrentAirPollution(lat, lon, apiKey) {
  if (!apiKey) {
    console.warn('OpenWeather API key not set. Skipping air pollution data.');
    return null;
  }
  var params = new URLSearchParams({ lat: lat, lon: lon, appid: apiKey });
  try {
    var resp = await fetch(OW_AIR_BASE + '?' + params, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error('OpenWeather HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('OpenWeather air pollution fetch failed: ' + err.message);
    return null;
  }
}

/**
 * Fetch air pollution forecast (up to 5 days).
 */
async function fetchAirPollutionForecast(lat, lon, apiKey) {
  if (!apiKey) return null;
  var params = new URLSearchParams({ lat: lat, lon: lon, appid: apiKey });
  try {
    var resp = await fetch(OW_AIR_BASE + '/forecast?' + params, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error('OpenWeather HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('OpenWeather forecast fetch failed: ' + err.message);
    return null;
  }
}

/**
 * Fetch multiple US cities' air pollution in parallel.
 */
async function fetchMultipleCitiesAirPollution(apiKey) {
  var cities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston', lat: 29.7604, lon: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lon: -112.0740 },
    { name: 'Miami', lat: 25.7617, lon: -80.1918 },
    { name: 'Denver', lat: 39.7392, lon: -104.9903 },
    { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  ];
  var promises = cities.map(function(city) {
    return fetchCurrentAirPollution(city.lat, city.lon, apiKey)
      .then(function(data) { return { city: city.name, data: data }; })
      .catch(function(err) { return { city: city.name, error: err.message }; });
  });
  return Promise.all(promises);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OW_AIR_BASE, POLLUTANT_LABELS, AQI_LABELS,
    fetchCurrentAirPollution, fetchAirPollutionForecast, fetchMultipleCitiesAirPollution,
  };
}

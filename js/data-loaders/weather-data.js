/**
 * Open-Meteo Weather Data Loader
 * 
 * Free, no API key required. Provides current weather, hourly forecasts,
 * and historical data for any location worldwide.
 * 
 * API: https://open-meteo.com/en/docs
 */

var OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

var DEFAULT_PARAMS = {
  temperature_unit: 'fahrenheit',
  windspeed_unit: 'mph',
  precipitation_unit: 'inch',
  timezone: 'America/New_York',
};

var US_CITIES = {
  newYork: { name: 'New York', lat: 40.7128, lon: -74.0060 },
  losAngeles: { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  chicago: { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  houston: { name: 'Houston', lat: 29.7604, lon: -95.3698 },
  phoenix: { name: 'Phoenix', lat: 33.4484, lon: -112.0740 },
  philadelphia: { name: 'Philadelphia', lat: 39.9526, lon: -75.1652 },
  sanAntonio: { name: 'San Antonio', lat: 29.4241, lon: -98.4936 },
  sanDiego: { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
  dallas: { name: 'Dallas', lat: 32.7767, lon: -96.7970 },
  miami: { name: 'Miami', lat: 25.7617, lon: -80.1918 },
  seattle: { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  denver: { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  atlanta: { name: 'Atlanta', lat: 33.7490, lon: -84.3880 },
  boston: { name: 'Boston', lat: 42.3601, lon: -71.0589 },
  minneapolis: { name: 'Minneapolis', lat: 44.9778, lon: -93.2650 },
};

/**
 * Fetch current weather for a location.
 */
async function fetchCurrentWeather(lat, lon, extras) {
  extras = extras || {};
  var params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl',
    temperature_unit: extras.temperature_unit || DEFAULT_PARAMS.temperature_unit,
    windspeed_unit: extras.windspeed_unit || DEFAULT_PARAMS.windspeed_unit,
    precipitation_unit: extras.precipitation_unit || DEFAULT_PARAMS.precipitation_unit,
    timezone: extras.timezone || DEFAULT_PARAMS.timezone,
  });
  var resp = await fetch(OPEN_METEO_BASE + '/forecast?' + params, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error('Open-Meteo HTTP ' + resp.status);
  return await resp.json();
}

/**
 * Fetch hourly forecast for a location.
 */
async function fetchHourlyForecast(lat, lon, hours) {
  hours = hours || 24;
  var params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover',
    temperature_unit: DEFAULT_PARAMS.temperature_unit,
    windspeed_unit: DEFAULT_PARAMS.windspeed_unit,
    precipitation_unit: DEFAULT_PARAMS.precipitation_unit,
    timezone: DEFAULT_PARAMS.timezone,
    forecast_hours: hours,
  });
  var resp = await fetch(OPEN_METEO_BASE + '/forecast?' + params, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error('Open-Meteo HTTP ' + resp.status);
  return await resp.json();
}

/**
 * Fetch weather alerts from Open-Meteo (NWS integration).
 */
async function fetchWeatherAlerts(lat, lon) {
  var params = new URLSearchParams({ latitude: lat, longitude: lon, timezone: DEFAULT_PARAMS.timezone });
  var resp = await fetch('https://api.open-meteo.com/v1/forecast?' + params + '&alerts=true', { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error('Open-Meteo HTTP ' + resp.status);
  return await resp.json();
}

/**
 * Fetch multiple cities' current weather in parallel.
 */
async function fetchAllCitiesCurrent() {
  var entries = Object.entries(US_CITIES);
  var promises = entries.map(function(entry) {
    return fetchCurrentWeather(entry[1].lat, entry[1].lon)
      .then(function(data) { return { key: entry[0], city: entry[1].name, data: data }; })
      .catch(function(err) { return { key: entry[0], city: entry[1].name, error: err.message }; });
  });
  return Promise.all(promises);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPEN_METEO_BASE, DEFAULT_PARAMS, US_CITIES,
    fetchCurrentWeather, fetchHourlyForecast, fetchWeatherAlerts, fetchAllCitiesCurrent,
  };
}

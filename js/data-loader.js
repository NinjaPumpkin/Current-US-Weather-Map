/**
 * Consolidated Data Loader — US Weather Map
 * 
 * Orchestrates all data source modules. Provides unified interface
 * for loading weather, satellite, air quality, fire, and disaster data.
 * 
 * Usage:
 *   <script type="module">
 *     import { DataLoader } from './js/data-loader.js';
 *     const loader = new DataLoader({ airnowKey: '...', waqiToken: '...' });
 *     const allData = await loader.loadAll();
 *   </script>
 */

import {
  getStaticImageUrls,
  getViewerUrl,
  SATELLITE_CONFIG,
  IMAGERY_BANDS,
} from './data-loaders/satellite-data.js';

import {
  fetchCurrentWeather,
  fetchHourlyForecast,
  fetchWeatherAlerts,
  fetchAllCitiesCurrent,
  US_CITIES,
} from './data-loaders/weather-data.js';

import {
  fetchAirNowByBbox,
  fetchAirNowForecast,
} from './data-loaders/airnow-data.js';

import {
  fetchAqicnByCity,
  fetchAqicnMultipleCities,
} from './data-loaders/aqicn-data.js';

import {
  fetchCurrentAirPollution,
  fetchMultipleCitiesAirPollution,
  POLLUTANT_LABELS,
  AQI_LABELS,
} from './data-loaders/openweather-airpollution-data.js';

import {
  fetchUsHeatmap,
} from './data-loaders/waqi-data.js';

import {
  fetchAndParseUsFires,
} from './data-loaders/firms-fire-data.js';

import {
  fetchAllEvents,
  fetchWildfireEvents,
  fetchSevereStormEvents,
  fetchUsEvents,
} from './data-loaders/eonet-disaster-data.js';

/**
 * DataLoader — unified data loading for the US Weather Map dashboard.
 * @param {object} config - API keys and options
 */
function DataLoader(config) {
  config = config || {};
  this.airnowKey = config.airnowKey || '';
  this.aqicnToken = config.aqicnToken || '';
  this.openweatherKey = config.openweatherKey || '';
  this.firmsMapKey = config.firmsMapKey || '';
  this.loadCache = {};
  this.lastLoad = null;
}

/**
 * Load all data sources in parallel.
 * Returns object with categories: satellite, weather, airQuality, fires, disasters.
 */
DataLoader.prototype.loadAll = async function() {
  var self = this;
  var results = {
    timestamp: new Date().toISOString(),
    satellite: null,
    weather: null,
    airQuality: null,
    fires: null,
    disasters: null,
    errors: [],
  };

  var promises = [
    self.loadSatellite().then(function(d) { results.satellite = d; }).catch(function(e) { results.errors.push({ source: 'satellite', error: e.message }); }),
    self.loadWeather().then(function(d) { results.weather = d; }).catch(function(e) { results.errors.push({ source: 'weather', error: e.message }); }),
    self.loadAirQuality().then(function(d) { results.airQuality = d; }).catch(function(e) { results.errors.push({ source: 'airQuality', error: e.message }); }),
    self.loadFires().then(function(d) { results.fires = d; }).catch(function(e) { results.errors.push({ source: 'fires', error: e.message }); }),
    self.loadDisasters().then(function(d) { results.disasters = d; }).catch(function(e) { results.errors.push({ source: 'disasters', error: e.message }); }),
  ];

  await Promise.allSettled(promises);
  self.lastLoad = results.timestamp;
  self.loadCache = results;
  return results;
};

/**
 * Load satellite imagery data.
 */
DataLoader.prototype.loadSatellite = async function() {
  return {
    staticImages: getStaticImageUrls(),
    viewerUrls: {
      goes16: {
        geocolor: getViewerUrl('goes16', 'conus', 'geocolor'),
        dayLandCloudFire: getViewerUrl('goes16', 'conus', 'dayLandCloudFire'),
      },
      goes18: {
        geocolor: getViewerUrl('goes18', 'conus', 'geocolor'),
        dayLandCloudFire: getViewerUrl('goes18', 'conus', 'dayLandCloudFire'),
      },
      goes19: {
        geocolor: getViewerUrl('goes19', 'fullDisk', 'geocolor'),
      },
    },
  };
};

/**
 * Load weather data from Open-Meteo.
 */
DataLoader.prototype.loadWeather = async function() {
  var cities = await fetchAllCitiesCurrent();
  var alerts = await fetchWeatherAlerts(39.8283, -98.5795).catch(function() { return null; });
  return {
    cities: cities,
    alerts: alerts,
  };
};

/**
 * Load air quality from all available sources.
 */
DataLoader.prototype.loadAirQuality = async function() {
  var results = {
    airnow: null,
    aqicn: null,
    openweather: null,
    waqi: null,
  };

  var promises = [];
  if (this.airnowKey) {
    promises.push(fetchAirNowByBbox(this.airnowKey).then(function(d) { results.airnow = d; }));
  }
  if (this.aqicnToken) {
    promises.push(fetchAqicnMultipleCities(this.aqicnToken).then(function(d) { results.aqicn = d; }));
  }
  if (this.openweatherKey) {
    promises.push(fetchMultipleCitiesAirPollution(this.openweatherKey).then(function(d) { results.openweather = d; }));
  }
  if (this.aqicnToken) {
    promises.push(fetchUsHeatmap(this.aqicnToken).then(function(d) { results.waqi = d; }));
  }

  await Promise.allSettled(promises);
  return results;
};

/**
 * Load fire data from NASA FIRMS.
 */
DataLoader.prototype.loadFires = async function() {
  if (!this.firmsMapKey) return { fires: [], source: 'none' };
  var fires = await fetchAndParseUsFires(this.firmsMapKey, 24, 'VIIRS_SNPP_NRT');
  return { fires: fires, count: fires.length, source: 'VIIRS_SNPP_NRT' };
};

/**
 * Load disaster events from NASA EONET.
 */
DataLoader.prototype.loadDisasters = async function() {
  var allEvents = await fetchUsEvents();
  var wildfires = await fetchWildfireEvents();
  var storms = await fetchSevereStormEvents();
  return {
    all: allEvents.events || [],
    wildfires: wildfires.events || [],
    storms: storms.events || [],
  };
};

/**
 * Get the last cached load result.
 */
DataLoader.prototype.getCached = function() {
  return this.loadCache;
};

export { DataLoader };

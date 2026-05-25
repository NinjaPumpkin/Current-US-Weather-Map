/**
 * NASA FIRMS Fire Data Loader
 * 
 * Fire Information for Resource Management System.
 * Provides real-time and near-real-time active fire/hotspot data
 * from MODIS (Aqua/Terra) and VIIRS (Suomi-NPP/NOAA-20).
 * 
 * API: https://firms.modaps.eosdis.nasa.gov/api/
 * Free tier with MAP_KEY (registration required).
 */

var FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

/**
 * Fetch active fires for US (CONUS) from last N hours.
 * @param {string} mapKey - FIRMS MAP_KEY
 * @param {number} hours - lookback hours (1-72 for MODIS, 1-24 for VIIRS)
 * @param {string} source - 'MODIS_NRT' or 'VIIRS_SNPP_NRT' or 'VIIRS_NOAA20_NRT'
 * @returns {Promise<string>} CSV text
 */
async function fetchUsFires(mapKey, hours, source) {
  hours = hours || 24;
  source = source || 'VIIRS_SNPP_NRT';
  if (!mapKey) {
    console.warn('FIRMS MAP_KEY not set. Skipping fire data.');
    return '';
  }
  // US bounding box: lat_min,lon_min,lat_max,lon_max
  var url = FIRMS_BASE + '/' + mapKey + '/' + source + '/USA/' + hours;
  try {
    var resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!resp.ok) throw new Error('FIRMS HTTP ' + resp.status);
    return await resp.text();
  } catch (err) {
    console.warn('FIRMS fetch failed: ' + err.message);
    return '';
  }
}

/**
 * Fetch fires for a custom bounding box.
 */
async function fetchFiresByBbox(mapKey, bbox, hours, source) {
  hours = hours || 24;
  source = source || 'VIIRS_SNPP_NRT';
  if (!mapKey) return '';
  // bbox = { latMin, lonMin, latMax, lonMax }
  var url = FIRMS_BASE + '/' + mapKey + '/' + source + '/' +
    bbox.latMin + ',' + bbox.lonMin + ',' + bbox.latMax + ',' + bbox.lonMax + '/' + hours;
  try {
    var resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!resp.ok) throw new Error('FIRMS HTTP ' + resp.status);
    return await resp.text();
  } catch (err) {
    console.warn('FIRMS bbox fetch failed: ' + err.message);
    return '';
  }
}

/**
 * Parse FIRMS CSV response into array of fire objects.
 */
function parseFirmsCsv(csvText) {
  if (!csvText || csvText.trim() === '') return [];
  var lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  var headers = lines[0].split(',');
  var fires = [];
  for (var i = 1; i < lines.length; i++) {
    var values = lines[i].split(',');
    if (values.length < headers.length) continue;
    var fire = {};
    for (var j = 0; j < headers.length; j++) {
      fire[headers[j].trim()] = values[j].trim();
    }
    fires.push(fire);
  }
  return fires;
}

/**
 * Fetch and parse US fires (convenience wrapper).
 */
async function fetchAndParseUsFires(mapKey, hours, source) {
  var csv = await fetchUsFires(mapKey, hours, source);
  return parseFirmsCsv(csv);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIRMS_BASE, fetchUsFires, fetchFiresByBbox, parseFirmsCsv, fetchAndParseUsFires };
}

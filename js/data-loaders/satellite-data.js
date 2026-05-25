/**
 * GOES-16/18/19 Satellite Imagery Data Loader
 * 
 * Provides direct viewer URLs for NOAA GOES satellite imagery.
 * GOES-16 covers East US, GOES-18 covers West US, GOES-19 covers full disk.
 * 
 * No API key required — these are public NOAA viewer endpoints.
 */

const SATELLITE_CONFIG = {
  goes16: {
    name: 'GOES-16 (East)',
    baseUrl: 'https://www.star.nesdis.noaa.gov/goes/abi/sector.php',
    sectors: { conus: 'conus', mesoscale: 'mesoscale1' },
  },
  goes18: {
    name: 'GOES-18 (West)',
    baseUrl: 'https://www.star.nesdis.noaa.gov/goes/abi/sector.php',
    sectors: { conus: 'conus', mesoscale: 'mesoscale1' },
  },
  goes19: {
    name: 'GOES-19 (Full Disk)',
    baseUrl: 'https://www.star.nesdis.noaa.gov/goes/abi/fullDisk.php',
    sectors: { fullDisk: 'fullDisk' },
  },
};

const IMAGERY_BANDS = {
  geocolor: 'GEOCOLOR',
  dayLandCloudFire: 'DayLandCloudFire',
  atmos: 'atmos',
  airMass: 'AirMass',
  sandwich: 'Sandwich',
  fireTemperature: 'FireTemperature',
  naturalColor: 'NaturalColor',
  glm: 'GLM',
};

/**
 * Build GOES viewer URL for a specific satellite, sector, and band.
 */
function getViewerUrl(satellite, sector, band) {
  const config = SATELLITE_CONFIG[satellite];
  if (!config) throw new Error('Unknown satellite: ' + satellite);
  const sectorParam = config.sectors[sector] || sector;
  const bandParam = IMAGERY_BANDS[band] || band;
  if (satellite === 'goes19') {
    return config.baseUrl + '?band=' + bandParam;
  }
  return config.baseUrl + '?satellite=' + satellite + '&sector=' + sectorParam + '&band=' + bandParam;
}

/**
 * Build all GOES static image URLs for latest imagery.
 * Direct PNG/JPEG URLs usable in <img> tags.
 */
function getStaticImageUrls() {
  var base = 'https://cdn.star.nesdis.noaa.gov';
  return {
    goes16: {
      conus: {
        geocolor: base + '/GOES16/ABI/CONUS/GEOCOLOR/latest.jpg',
        dayLandCloudFire: base + '/GOES16/ABI/CONUS/DayLandCloudFire/latest.jpg',
      },
    },
    goes18: {
      conus: {
        geocolor: base + '/GOES18/ABI/CONUS/GEOCOLOR/latest.jpg',
        dayLandCloudFire: base + '/GOES18/ABI/CONUS/DayLandCloudFire/latest.jpg',
      },
    },
    goes19: {
      fullDisk: {
        geocolor: base + '/GOES19/ABI/FD/GEOCOLOR/latest.jpg',
      },
    },
  };
}

/**
 * Fetch GOES metadata from NOAA.
 */
async function fetchGoesMetadata(satellite) {
  satellite = satellite || 'goes16';
  var url = 'https://www.star.nesdis.noaa.gov/smcd/emb/pythonci/data/GOESjson/getjson.py?satellite=' + satellite;
  try {
    var resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('GOES metadata fetch failed for ' + satellite + ': ' + err.message);
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SATELLITE_CONFIG, IMAGERY_BANDS, getViewerUrl, getStaticImageUrls, fetchGoesMetadata };
}

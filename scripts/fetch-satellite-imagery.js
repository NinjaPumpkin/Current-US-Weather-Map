/**
 * Satellite Imagery Fetcher
 * 
 * Migrated from satellite-weather-fetcher (CoCalc CI).
 * Downloads latest GOES-16/18/19 imagery and saves to data/ directory.
 * 
 * Used by GitHub Actions workflow and can be run locally.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data', 'satellite');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const SATELLITES = {
  goes16: {
    name: 'GOES-16 (East)',
    urls: {
      geocolor: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/latest.jpg',
      dayLandCloudFire: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/DayLandCloudFire/latest.jpg',
    },
  },
  goes18: {
    name: 'GOES-18 (West)',
    urls: {
      geocolor: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/CONUS/GEOCOLOR/latest.jpg',
      dayLandCloudFire: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/CONUS/DayLandCloudFire/latest.jpg',
    },
  },
  goes19: {
    name: 'GOES-19 (Full Disk)',
    urls: {
      geocolor: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/latest.jpg',
    },
  },
};

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', err => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function fetchAllSatelliteImages() {
  const results = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const [satKey, sat] of Object.entries(SATELLITES)) {
    results[satKey] = { name: sat.name, images: {} };
    for (const [band, url] of Object.entries(sat.urls)) {
      const filename = satKey + '-' + band + '-' + timestamp + '.jpg';
      const destPath = path.join(dataDir, filename);
      try {
        await downloadImage(url, destPath);
        results[satKey].images[band] = {
          file: 'data/satellite/' + filename,
          timestamp: new Date().toISOString(),
        };
        console.log('  Saved: ' + filename);
      } catch (err) {
        console.warn('  Failed: ' + satKey + '/' + band + ' - ' + err.message);
        results[satKey].images[band] = { error: err.message };
      }
    }
  }

  // Save manifest
  const manifestPath = path.join(dataDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log('Manifest saved: ' + manifestPath);

  // Clean up old images (keep last 24 hours)
  cleanupOldImages();

  return results;
}

function cleanupOldImages() {
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  try {
    const files = fs.readdirSync(dataDir);
    let removed = 0;
    for (const file of files) {
      if (file === 'manifest.json') continue;
      const filePath = path.join(dataDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        removed++;
      }
    }
    if (removed > 0) console.log('Cleaned up ' + removed + ' old satellite images.');
  } catch (err) {
    console.warn('Cleanup warning: ' + err.message);
  }
}

if (require.main === module) {
  console.log('Fetching satellite imagery...');
  fetchAllSatelliteImages()
    .then(() => console.log('Done.'))
    .catch(err => { console.error('Error:', err.message); process.exit(1); });
}

module.exports = { fetchAllSatelliteImages, downloadImage, SATELLITES };

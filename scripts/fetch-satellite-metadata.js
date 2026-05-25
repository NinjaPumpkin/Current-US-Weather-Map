const https = require('https');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const satellites = ['goes16', 'goes18'];
const results = {};
let pending = satellites.length;

function done() {
  if (--pending === 0) {
    fs.writeFileSync(path.join(dataDir, 'satellite-metadata.json'), JSON.stringify(results, null, 2));
    console.log('Satellite metadata saved.');
  }
}

satellites.forEach(sat => {
  const url = 'https://www.star.nesdis.noaa.gov/smcd/emb/pythonci/data/GOESjson/getjson.py?satellite=' + sat;
  https.get(url, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { results[sat] = JSON.parse(data); } catch (e) { results[sat] = { error: e.message }; }
      done();
    });
  }).on('error', err => {
    results[sat] = { error: err.message };
    done();
  });
});

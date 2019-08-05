const path = require('path');
const os = require('os');
const fs = require('fs');
const del = require('del');
const mkdirp = require('mkdirp');

const tmpDir = os.tmpdir();
const CACHE_DIR = path.resolve(tmpDir, 'dumber');

function cachedFilePath(hash) {
  const folder = hash.slice(0, 2);
  const fileName = hash.slice(2);
  return path.resolve(CACHE_DIR, folder, fileName);
}

exports.getCache = function(hash) {
  const filePath = cachedFilePath(hash);
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (e) {
    // ignore
  }
};

exports.setCache = function(hash, object) {
  const filePath = cachedFilePath(hash);
  mkdirp.sync(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(object));
};

exports.clearCache = function() {
  return del(CACHE_DIR, {force: true});
};

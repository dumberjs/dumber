const path = require('path');
const os = require('os');
const fs = require('fs');
const del = require('del');
const mkdirp = require('mkdirp');
const {version} = require('../../package.json');

const TMP_DIR = path.resolve(os.tmpdir(), 'dumber');
const CACHE_DIR = path.resolve(TMP_DIR, version);

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
  // TODO remove mkdirp once we can lift mininum
  // nodejs version to 10.12.0
  mkdirp.sync(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(object));
};

exports.clearCache = function() {
  // TODO nodejs v12.10.0+ provided fs.rmdir with recursive option
  return del(TMP_DIR, {force: true});
};

/* global localStorage */
exports.getCache = function(hash) {
  try {
    return JSON.parse(localStorage.getItem(hash))
  } catch (e) {
    // ignore
  }
};

exports.setCache = function(hash, object) {
  localStorage.setItem(hash, JSON.stringify(object));
};

exports.clearCache = function() {
  return new Promise(resolve => {
    localStorage.clear();
    resolve();
  });
};

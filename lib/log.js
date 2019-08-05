exports.info = function(message) {
  console.info(`\x1b[36m[dumber] ${message}\x1b[0m`);
}

exports.warn = function(message) {
  console.warn(`\x1b[32m[dumber] ${message}\x1b[0m`);
}

exports.error = function(message) {
  console.error(`\x1b[31m[dumber] ${message}\x1b[0m`);
}

const Bundler = require('./lib');
const ensureParserSet = require('./lib/ensure-parser-set');
Bundler.ensureParserSet = ensureParserSet;
module.exports = Bundler;

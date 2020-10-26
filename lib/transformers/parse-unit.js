const {ensureParsed} = require('ast-matcher');
require('../ensure-parser-set')();

exports.parseUnit = function(unit) {
  return unit.parsed || ensureParsed(unit.contents);
};

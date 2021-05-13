const astMatcher = require('ast-matcher');

const isUMD = astMatcher('typeof define === "function" && define.amd');
const isUMD2 = astMatcher('typeof define == "function" && define.amd');

module.exports = function(parsed) {
  return isUMD(parsed) || isUMD2(parsed);
};

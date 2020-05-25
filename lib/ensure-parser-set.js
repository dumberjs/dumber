const {parse} = require('meriyah');
const astMatcher = require('ast-matcher');

function _parser(contents) {
  // Turn on range to get position info in scope analysis.
  return parse(contents, {
    module: true,
    next: true,
    ranges: true,
    webcompact: true,
    specDeviation: true
  });
}

module.exports = function() {
  if (!astMatcher.__amd_parser_set) {
    astMatcher.setParser(_parser);
    astMatcher.__amd_parser_set = true;
  }
};


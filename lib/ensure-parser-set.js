const {parse} = require('cherow');
const astMatcher = require('ast-matcher');

function _parser (contents) {
  // Turn on range to get position info in scope analysis.
  // Do not need to turn on JSX, dumber is designed to be
  // small, supposes to be used after transpiling.
  return parse(contents, {ranges: true, loc: true, module: true, next: true});
}

module.exports = function() {
  if (!astMatcher.__amd_parser_set) {
    astMatcher.setParser(_parser);
    astMatcher.__amd_parser_set = true;
  }
};


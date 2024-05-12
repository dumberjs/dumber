const oxc = require("oxc-parser");
const astMatcher = require('ast-matcher');

function _parser(contents) {
  const { program } = oxc.parseSync(contents);
  return JSON.parse(program);
}

module.exports = function() {
  if (!astMatcher.__amd_parser_set) {
    astMatcher.setParser(_parser);
    astMatcher.__amd_parser_set = true;
  }
};


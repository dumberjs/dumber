import {parse} from 'cherow';
import astMatcher from 'ast-matcher';

function _parser (contents) {
  // Turn on range to get position info in scope analysis.
  // Do not need to turn on JSX, dumber is designed to be
  // small, supposes to be used after transpiling.
  return parse(contents, {ranges: true, loc: true, module: true});
}

if (!astMatcher.__amd_parser_set) {
  astMatcher.setParser(_parser);
  astMatcher.__amd_parser_set = true;
}

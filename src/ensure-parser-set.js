import {parseModule} from 'esprima';
import astMatcher from 'ast-matcher';

function parser (contents) {
  // Turn on range to get position info in scope analysis.
  // Do not need to turn on JSX, dumber is designed to be
  // small, supposes to be used after transpiling.
  return parseModule(contents, {range: true});
}

if (!astMatcher.__amd_parser_set) {
  astMatcher.setParser(parser);
  astMatcher.__amd_parser_set = true;
}

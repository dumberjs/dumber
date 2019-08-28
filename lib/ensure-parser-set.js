const {parse} = require('@babel/parser');
const astMatcher = require('ast-matcher');

function _parser (contents) {
  // Turn on range to get position info in scope analysis.
  // Do not need to turn on JSX, dumber is designed to be
  // small, supposes to be used after transpiling.
  const file = parse(contents, {sourceType: 'module', plugins: [
    // 'jsx',
    // 'typescript',
    'asyncGenerators',
    'bigInt',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'decorators-legacy',
    // ['decorators', {'decoratorsBeforeExport': true}],
    'doExpressions',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'functionBind',
    'functionSent',
    'importMeta',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    'partialApplication',
    // ['pipelineOperator', {proposal: 'minimal'}],
    'throwExpressions',
    'estree' // VERY IMPORTANT to be compatible with ast-matcher
  ]});
  return file && file.program;
}

module.exports = function() {
  if (!astMatcher.__amd_parser_set) {
    astMatcher.setParser(_parser);
    astMatcher.__amd_parser_set = true;
  }
};


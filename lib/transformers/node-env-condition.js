// Eliminate code branch like if (process.env.NODE_ENV !== 'production') { ... }
// Note we don't deal with if (...) {} else if (...) {}
//
// For the missed usage of process.env.NODE_ENV (like _process.env.NODE_ENV),
// it will be resolved at runtime with correct NODE_ENV value packed at build time.
// The runtime value is handled by ./process-env.js
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;
require('../ensure-parser-set')();
const modifyCode = require('modify-code').default;

const ifStatement = astMatcher('if ( __any_condition ) { __anl }');
const ifElseStatement = astMatcher('if ( __any_condition ) { __anl } else { __anl }');

const envMatch1 = astMatcher('process.env.NODE_ENV');
const envMatch2 = astMatcher("process.env['NODE_ENV']");

module.exports = function(unit, _nodeEnv /* for test */) {
  if (!_nodeEnv) {
    _nodeEnv = process.env.NODE_ENV;
  }

  const {contents, sourceMap, path} = unit;
  const parsed = ensureParsed(contents);
  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename);

  const ifMatch = ifStatement(parsed);
  if (ifMatch) {
    ifMatch.forEach(result => {
      const {condition} = result.match;
      const wanted = nodeEnvCheck(condition, _nodeEnv);
      if (typeof wanted === 'boolean') {
        if (wanted) {
          // fix the condition to true
          m.replace(condition.start, condition.end, 'true');
        } else {
          // remove the whole block
          m.delete(result.node.start, result.node.end);
        }
      }
    });
  }

  const ifElseMatch = ifElseStatement(parsed);
  if (ifElseMatch) {
    ifElseMatch.forEach(result => {
      const {condition} = result.match;
      const wanted = nodeEnvCheck(condition, _nodeEnv);

      if (typeof wanted === 'boolean') {
        const branch = wanted ?
          // retain consequent branch
          contents.slice(result.node.consequent.start, result.node.consequent.end) :
          // retain alternate branch
          contents.slice(result.node.alternate.start, result.node.alternate.end);
        m.replace(result.node.start, result.node.end, 'if (true) ' + branch);
      }
    });
  }

  const result = m.transform();
  if (result.code === contents) {
    // no change
    return;
  }

  return {
    contents: result.code,
    sourceMap: result.map
  };
};

// returns undefined if the exp is not a check on NODE_ENV
function nodeEnvCheck(exp, _nodeEnv) {
  const {type, operator, left, right} = exp;
  if (type !== 'BinaryExpression') return;

  let targetValue;
  let possibleRef;
  if (left.type === 'Literal') {
    targetValue === left.value;
    possibleRef === right;
  } else if (right.type === 'Literal') {
    targetValue = right.value;
    possibleRef = left;
  } else {
    return;
  }

  if (!isNodeEnvExpression(possibleRef)) return;
  // eslint-disable-next-line no-new-func
  return (new Function(`return ${JSON.stringify(_nodeEnv)} ${operator} ${JSON.stringify(targetValue)};`))();
}

function isNodeEnvExpression(exp) {
  const env1 = envMatch1(exp);
  if (env1 && env1.length === 1 && env1[0].node === exp) return true;
  const env2 = envMatch2(exp);
  if (env2 && env2.length === 1 && env2[0].node === exp) return true;
  return false;
}

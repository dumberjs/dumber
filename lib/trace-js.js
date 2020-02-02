'use strict';
const hackMoment = require('./transformers/hack-moment');
const processEnv = require('./transformers/process-env');
const nodeEnvCondition = require('./transformers/node-env-condition');
const esmToCjs = require('./transformers/esm-to-cjs');
const replace = require('./transformers/replace');
const cjsToAmd = require('./transformers/cjs-to-amd');
const nameAmdDefine = require('./transformers/name-amd-define');
const shimAmd = require('./transformers/shim-amd');
const transform = require('./transform');

const transformers = [
  hackMoment,
  processEnv,
  nodeEnvCondition,
  esmToCjs,
  replace,
  cjsToAmd,
  nameAmdDefine,
  shimAmd
];

module.exports = function(unit) {
  return transform(unit, ...transformers)
};

const {test} = require('zora');
const hackMoment = require('../../lib/transformers/hack-moment');

test('hackMoment patches momentjs to expose global var "moment"', t => {
  const moment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () {})));`;

  const transformedMoment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? (function(){var m=factory();if(typeof moment === 'undefined' && typeof global !== 'undefined'){global.moment=m;} define(function(){return m;})})() :
    global.moment = factory()
}(this, (function () {})));`;

  const unit = {
    path: 'node_modules/moment/moment.js',
    contents: moment,
    sourceMap: undefined,
    moduleId: 'moment/moment',
    packageName: 'moment'
  }

  t.deepEqual(hackMoment(unit), {contents: transformedMoment});
});

test('hackMoment ignores other package name', t => {
  const moment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () {})));`;


  const unit = {
    path: 'node_modules/moment2/moment.js',
    contents: moment,
    sourceMap: undefined,
    moduleId: 'moment2/moment',
    packageName: 'moment2'
  }

  t.notOk(hackMoment(unit));
});

test('hackMoment ignores local file', t => {
  const moment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () {})));`;


  const unit = {
    path: 'src/moment.js',
    contents: moment,
    sourceMap: undefined,
    moduleId: 'moment'
  }

  t.notOk(hackMoment(unit));
});

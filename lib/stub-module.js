const {warn} = require('./log');

// stub core Node.js modules based on https://github.com/webpack/node-libs-browser/blob/master/index.js
// no need stub for following modules, they got same name on npm package
//
// assert
// buffer
// events
// punycode
// process
// string_decoder
// url
// util

// fail on following core modules has no stub
const UNAVAIABLE_CORE_MODULES = [
  'child_process',
  'cluster',
  'dgram',
  'dns',
  // 'fs',
  'net',
  'readline',
  'repl',
  'tls',
  'worker_thread'
];

const EMPTY_MODULE = 'define(function(){return {};});';

module.exports = function(moduleId, resolve) {
  // with subfix -browserify
  if (['crypto', 'https', 'os', 'path', 'stream', 'timers', 'tty', 'vm'].indexOf(moduleId) !== -1) {
    return {name: moduleId, location: resolve(`${moduleId}-browserify`)};
  }

  if (moduleId === 'domain') {
    warn('core Node.js module "domain" is deprecated');
    return {name: 'domain', location: resolve('domain-browser')};
  }

  if (moduleId === 'http') {
    return {name: 'http', location: resolve('stream-http')};
  }

  if (moduleId === 'querystring') {
    // using querystring-es3 next version 1.0.0-0
    return {name: 'querystring', location: resolve('querystring-es3')};
  }

  if (moduleId === 'sys') {
    warn('core Node.js module "sys" is deprecated, the stub is disabled in CLI bundler due to conflicts with "util"');
    return EMPTY_MODULE;
  }

  if (moduleId === 'zlib') {
    return {name: 'zlib', location: resolve('browserify-zlib')};
  }

  if (moduleId === 'fs') {
    return {name: 'fs', location: resolve('fs-browser-stub')};
  }

  if (UNAVAIABLE_CORE_MODULES.indexOf(moduleId) !== -1) {
    return EMPTY_MODULE;
  }

  // https://github.com/defunctzombie/package-browser-field-spec
  // {"module-a": false}
  // replace with special placeholder __ignore__
  if (moduleId === '__ignore__') {
    return EMPTY_MODULE;
  }
};

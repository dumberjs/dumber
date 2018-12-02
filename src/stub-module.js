import {resolvePackagePath, warn} from './shared';

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
  'fs',
  'net',
  'readline',
  'repl',
  'tls'
];

const EMPTY_MODULE = 'define(function(){return {};});';

function resolve(packageName) {
  if (require && typeof require.resolve === 'function') {
    return resolvePackagePath(packageName);
  }
  // browser
  return packageName;
}

// note all paths here assumes local node_modules folder
export default function(moduleId) {
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

  if (UNAVAIABLE_CORE_MODULES.indexOf(moduleId) !== -1) {
    warn(`No avaiable stub for core Node.js module "${moduleId}", stubbed with empty module`);
    return EMPTY_MODULE;
  }

  // https://github.com/defunctzombie/package-browser-field-spec
  // {"module-a": false}
  // replace with special placeholder __ignore__
  if (moduleId === '__ignore__') {
    return EMPTY_MODULE;
  }
}

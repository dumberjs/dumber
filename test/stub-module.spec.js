const test = require('tape');
const path = require('path');
const stubModule = require('../lib/stub-module');


function resolve(packageName) {
  if (require && typeof require.resolve === 'function') {
    return path.relative(process.cwd(), path.resolve('node_modules/' + packageName));
  }
  // browser
  return packageName;
}

test('stubModule stubs some core module with subfix -browserify', t => {
  t.deepEqual(stubModule('os'),{
    name: 'os',
    location: resolve('os-browserify')
  });
  t.end();
});

test('stubModule stubs domain', t => {
  t.deepEqual(stubModule('domain'),{
    name: 'domain',
    location: resolve('domain-browser')
  });
  t.end();
});

test('stubModule stubs http', t => {
  t.deepEqual(stubModule('http'),{
    name: 'http',
    location: resolve('stream-http')
  });
  t.end();
});

test('stubModule stubs querystring', t => {
  t.deepEqual(stubModule('querystring'),{
    name: 'querystring',
    location: resolve('querystring-es3')
  });
  t.end();
});

test('stubModule ignores sys', t => {
  t.equal(stubModule('sys'), 'define(function(){return {};});');
  t.end();
});

test('stubModule stubs zlib', t => {
  t.deepEqual(stubModule('zlib'),{
    name: 'zlib',
    location: resolve('browserify-zlib')
  });
  t.end();
});

test('stubModule stubs fs', t => {
  t.deepEqual(stubModule('fs'),{
    name: 'fs',
    location: resolve('fs-browser-stub')
  });
  t.end();
});

test('stubModule stubs empty module for some core module', t => {
  t.equal(stubModule('dns'), 'define(function(){return {};});');
  t.end();
});

test('stubModule stubs empty module for __ignore__', t => {
  t.equal(stubModule('__ignore__'), 'define(function(){return {};});');
  t.end();
});

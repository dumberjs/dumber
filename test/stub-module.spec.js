const test = require('tape');
const stubModule = require('../lib/stub-module');

function resolve(packageName) {
  return 'node_modules/' + packageName;
}

test('stubModule stubs some core module with subfix -browserify', t => {
  t.deepEqual(stubModule('os', resolve),{
    name: 'os',
    location: resolve('os-browserify')
  });
  t.end();
});

test('stubModule stubs domain', t => {
  t.deepEqual(stubModule('domain', resolve),{
    name: 'domain',
    location: resolve('domain-browser')
  });
  t.end();
});

test('stubModule stubs http', t => {
  t.deepEqual(stubModule('http', resolve),{
    name: 'http',
    location: resolve('stream-http')
  });
  t.end();
});

test('stubModule stubs querystring', t => {
  t.deepEqual(stubModule('querystring', resolve),{
    name: 'querystring',
    location: resolve('querystring-es3')
  });
  t.end();
});

test('stubModule ignores sys', t => {
  t.equal(stubModule('sys', resolve), 'define(function(){return {};});');
  t.end();
});

test('stubModule stubs zlib', t => {
  t.deepEqual(stubModule('zlib', resolve),{
    name: 'zlib',
    location: resolve('browserify-zlib')
  });
  t.end();
});

test('stubModule stubs fs', t => {
  t.deepEqual(stubModule('fs', resolve),{
    name: 'fs',
    location: resolve('fs-browser-stub')
  });
  t.end();
});

test('stubModule stubs empty module for some core module', t => {
  t.equal(stubModule('dns', resolve), 'define(function(){return {};});');
  t.end();
});

test('stubModule stubs empty module for __ignore__', t => {
  t.equal(stubModule('__ignore__', resolve), 'define(function(){return {};});');
  t.end();
});

const test = require('tape');
const stubModule = require('../lib/stub-module');

function resolve(packageName) {
  return 'node_modules/' + packageName;
}

test('can resolve to required stubbing', t => {
  t.doesNotThrow(() => require.resolve('assert/'));
  t.doesNotThrow(() => require.resolve('buffer/'));
  t.doesNotThrow(() => require.resolve('events/'));
  t.doesNotThrow(() => require.resolve('punycode/'));
  t.doesNotThrow(() => require.resolve('process/'));
  t.doesNotThrow(() => require.resolve('string_decoder/'));
  t.doesNotThrow(() => require.resolve('url/'));
  t.doesNotThrow(() => require.resolve('util/'));

  t.throws(() => require.resolve('child_process/'));
  t.throws(() => require.resolve('cluster/'));
  t.throws(() => require.resolve('dgram/'));
  t.throws(() => require.resolve('dns/'));
  t.throws(() => require.resolve('net/'));
  t.throws(() => require.resolve('readline/'));
  t.throws(() => require.resolve('repl/'));
  t.throws(() => require.resolve('tls/'));
  t.throws(() => require.resolve('worker_thread/'));
  t.throws(() => require.resolve('sys/'));

  t.doesNotThrow(() => require.resolve('crypto-browserify'));
  t.doesNotThrow(() => require.resolve('https-browserify'));
  t.doesNotThrow(() => require.resolve('os-browserify'));
  t.doesNotThrow(() => require.resolve('path-browserify'));
  t.doesNotThrow(() => require.resolve('stream-browserify'));
  t.doesNotThrow(() => require.resolve('timers-browserify'));
  t.doesNotThrow(() => require.resolve('tty-browserify'));
  t.doesNotThrow(() => require.resolve('vm-browserify'));

  t.doesNotThrow(() => require.resolve('domain-browser'));
  t.doesNotThrow(() => require.resolve('stream-http'));
  t.doesNotThrow(() => require.resolve('querystring-es3'));
  t.doesNotThrow(() => require.resolve('browserify-zlib'));
  t.doesNotThrow(() => require.resolve('fs-browser-stub'));

  t.end();
});

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

import test from 'tape';
import path from 'path';
import stubModule from '../src/stub-module';


function resolve(packageName) {
  if (require && typeof require.resolve === 'function') {
    return path.resolve('node_modules/' + packageName);
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

test('stubModule stubs local readable-stream', t => {
  t.deepEqual(stubModule('readable-stream'),{
    name: 'readable-stream',
    location: resolve('readable-stream')
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

test('stubModule stubs empty module for some core module', t => {
  t.equal(stubModule('fs'), 'define(function(){return {};});');
  t.end();
});

test('stubModule stubs empty module for __ignore__', t => {
  t.equal(stubModule('__ignore__'), 'define(function(){return {};});');
  t.end();
});

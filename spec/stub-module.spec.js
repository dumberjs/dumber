import test from 'tape';
import path from 'path';
import stubModule from '../src/stub-module';

test('stubModule stubs some core module with subfix -browserify', t => {
  t.deepEqual(stubModule('os'),{
    name: 'os',
    location: path.resolve('node_modules/os-browserify')
  });
  t.end();
});

test('stubModule stubs domain', t => {
  t.deepEqual(stubModule('domain'),{
    name: 'domain',
    location: path.resolve('node_modules/domain-browser')
  });
  t.end();
});

test('stubModule stubs http', t => {
  t.deepEqual(stubModule('http'),{
    name: 'http',
    location: path.resolve('node_modules/stream-http')
  });
  t.end();
});

test('stubModule stubs querystring', t => {
  t.deepEqual(stubModule('querystring'),{
    name: 'querystring',
    location: path.resolve('node_modules/querystring-es3')
  });
  t.end();
});

test('stubModule ignores sys', t => {
  t.notOk(stubModule('sys'));
  t.end();
});

test('stubModule stubs zlib', t => {
  t.deepEqual(stubModule('zlib'),{
    name: 'zlib',
    location: path.resolve('node_modules/browserify-zlib')
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

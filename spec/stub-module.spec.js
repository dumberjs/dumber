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

test('stubModule ignores sys', t => {
  t.notOk(stubModule('sys'));
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

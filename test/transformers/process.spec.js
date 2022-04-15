const test = require('tape');
const processEnv = require('../../lib/transformers/process');

test('processEnv bypasses local file', t => {
  const unit = {
    path: 'src/process.js',
    contents: 'lorem',
    sourceMap: undefined,
    moduleId: 'process'
  };

  t.notOk(processEnv(unit));
  t.end();
});

test('processEnv bypasses other npm package', t => {
  const unit = {
    path: 'node_modules/process2/index.js',
    contents: 'lorem',
    sourceMap: undefined,
    moduleId: 'process2/index',
    packageName: 'process2'
  };

  t.notOk(processEnv(unit));
  t.end();
});

test('processEnv add NODE_ENV to npm package "process"', t => {
  const unit = {
    path: 'node_modules/process/browser.js',
    contents: 'lorem',
    sourceMap: undefined,
    moduleId: 'process/browser',
    packageName: 'process'
  };
  const mock = {
    env: {NODE_ENV: 'foo'},
    version: 'v14.18.1',
    versions: {
      node: '14.18.1',
      v8: '8.4.371.23-node.84'
    }
  };
  t.deepEqual(processEnv(unit, mock), {contents: 'lorem\nprocess.env = {NODE_ENV:"foo"};\nprocess.version = "v14.18.1";\nprocess.versions = {"node":"14.18.1","v8":"8.4.371.23-node.84"};\n'});
  t.end();
});

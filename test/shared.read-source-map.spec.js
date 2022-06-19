const fs = require('fs');
const path = require('path');
const {test} = require('zora');
const {getSourceMap} = require('../lib/shared');

// no test in browser
test('getSourceMap gets referenced sourceMap file content', t => {
  const filePath = path.join('test', 'fixtures', 'y.js');
  const contents = fs.readFileSync(filePath, 'utf8');
  const sourceMap = getSourceMap(contents, filePath);
  t.ok(sourceMap);
  t.deepEqual(sourceMap.sources, ['test/fixtures/src/x.js']);
  t.ok(sourceMap.sourcesContent);
  t.equal(sourceMap.sourcesContent.length, 1);
  t.equal(typeof sourceMap.sourcesContent[0], 'string');
  t.ok(sourceMap.sourcesContent[0].includes('_.trim'));
});

test('getSourceMap ignores missing sourceMap file', t => {
  const filePath = path.join('test', 'fixtures', 'missing.js');
  const contents = fs.readFileSync(filePath, 'utf8');
  const sourceMap = getSourceMap(contents, filePath);
  t.notOk(sourceMap);
});

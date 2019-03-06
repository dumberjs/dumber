import fs from 'fs';
import path from 'path';
import test from 'tape';
import {getSourceMap} from '../src/shared';

// no test in browser
test('getSourceMap gets referenced sourceMap file content', t => {
  const filePath = path.resolve(__dirname, 'fixtures', 'y.js');
  const contents = fs.readFileSync(filePath, 'utf8');
  const sourceMap = getSourceMap(contents, filePath);
  t.ok(sourceMap);
  t.deepEqual(sourceMap.sources, ['src/x.js']);
  t.ok(sourceMap.sourcesContent);
  t.equal(sourceMap.sourcesContent.length, 1);
  t.equal(typeof sourceMap.sourcesContent[0], 'string');
  t.ok(sourceMap.sourcesContent[0].includes('_.trim'));
  t.end();
});

test('getSourceMap ignores missing sourceMap file', t => {
  const filePath = path.resolve(__dirname, 'fixtures', 'missing.js');
  const contents = fs.readFileSync(filePath, 'utf8');
  const sourceMap = getSourceMap(contents, filePath);
  t.notOk(sourceMap);
  t.end();
});

const {test} = require('zora');
const json = require('../../lib/transformers/json');

test('json wraps json into amd module', t => {
  const source = '{"a":1}';
  const target = "define('a.json',function(){return JSON.parse(\"{\\\"a\\\":1}\");});";

  t.deepEqual(json({
    moduleId: 'a.json',
    contents: source,
    path: 'src/a.json'
  }), {
    defined: ['a.json'],
    deps: [],
    contents: target,
    sourceMap: {
      version: 3,
      file: 'src/a.json',
      sources: ['src/a.json'],
      mappings: 'AAAA',
      names: [],
      sourcesContent: [source]
    }
  });
});

test('json skips identity source map when there is existing map', t => {
  const source = '{"a":1}';
  const target = "define('a.json',function(){return JSON.parse(\"{\\\"a\\\":1}\");});";

  t.deepEqual(json({
    moduleId: 'a.json',
    contents: source,
    path: 'src/a.json',
    sourceMap: {
      version: 3,
      file: 'src/a.json',
      sources: ['src/a.json'],
      mappings: '',
      names: [],
      sourcesContent: [source]
    }
  }), {
    defined: ['a.json'],
    deps: [],
    contents: target
  });
});

import test from 'tape';
import json from '../../src/transformers/json';

test('json wraps json into amd module', t => {
  const source = '{"a":1}';
  const target = "define('text!a.json',function(){return \"{\\\"a\\\":1}\";});define('a.json',['text!a.json'],function(m){return JSON.parse(m);});";

  t.deepEqual(json({
    moduleId: 'a.json',
    contents: source,
    path: 'src/a.json'
  }), {
    defined: ['a.json', 'text!a.json'],
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
  t.end();
});

test('json skips identity source map when there is existing map', t => {
  const source = '{"a":1}';
  const target = "define('text!a.json',function(){return \"{\\\"a\\\":1}\";});define('a.json',['text!a.json'],function(m){return JSON.parse(m);});";

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
    defined: ['a.json', 'text!a.json'],
    deps: [],
    contents: target
  });
  t.end();
});

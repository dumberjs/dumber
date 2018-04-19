'use strict';
const test = require('tape');
const json = require('../../lib/transformers/json');

test('json wraps json into amd module', t => {
  const source = '{"a":1}';
  const target = "define('text!a.json',function(){return \"{\\\"a\\\":1}\";});\n" +
                 "define('a.json',['text!a.json'],function(m){return JSON.parse(m);});\n" +
                 "define('json!a.json',['a.json'],function(m){return m;});\n";
  t.deepEqual(json('a.json', source), {
    defined: ['text!a.json', 'a.json', 'json!a.json'],
    contents: target
  });
  t.end();
});

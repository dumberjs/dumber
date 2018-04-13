'use strict';
const test = require('tape');
const text = require('../../lib/transformers/text');

test('text wraps text into amd module', t => {
  const source = '<p></p>';
  const target = "define('text!a.html',function(){return \"<p></p>\";});\n";

  t.deepEqual(text('a.html', source), {
    defined: 'text!a.html',
    contents: target
  });
  t.end();
});

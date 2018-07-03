import test from 'tape';
import text from '../../src/transformers/text';

test('text wraps text into amd module', t => {
  const source = '<p></p>';
  const target = "define('text!a.html',function(){return \"<p></p>\";});\n" +
                 "define('a.html',['text!a.html'],function(m){return m;});\n";

  t.deepEqual(text('a.html', source), {
    defined: ['text!a.html', 'a.html'],
    contents: target
  });
  t.end();
});

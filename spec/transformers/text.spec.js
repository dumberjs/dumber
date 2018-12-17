import test from 'tape';
import text from '../../src/transformers/text';

test('text wraps text into amd module', t => {
  const source = '<p></p>';
  const target = "define('text!a.html',function(){return \"<p></p>\";});";

  t.deepEqual(text('a.html', source), {
    defined: 'text!a.html',
    contents: target
  });
  t.end();
});

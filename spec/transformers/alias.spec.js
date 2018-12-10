import test from 'tape';
import alias from '../../src/transformers/alias';

test('alias creates aliases for js module', t => {
  t.deepEqual(alias('from/id', 'to/id'), {
    defined: 'from/id',
    contents: "define('from/id',['to/id'],function(m){return m;});"
  });
  t.deepEqual(alias('from/id.js', 'to/id'), {
    defined: 'from/id',
    contents: "define('from/id',['to/id'],function(m){return m;});"
  });
  t.deepEqual(alias('from/id', 'to/id.js'), {
    defined: 'from/id',
    contents: "define('from/id',['to/id'],function(m){return m;});"
  });
  t.deepEqual(alias('from/id.js', 'to/id.js'), {
    defined: 'from/id',
    contents: "define('from/id',['to/id'],function(m){return m;});"
  });
  t.end();
});

test('alias creates aliases for other modules', t => {
  t.deepEqual(alias('from/id.json', 'to/id.json'), {
    defined: 'text!from/id.json',
    contents: "define('text!from/id.json',['text!to/id.json'],function(m){return m;});"
  });
  t.deepEqual(alias('from/id.css', 'to/id.css'), {
    defined: 'text!from/id.css',
    contents: "define('text!from/id.css',['text!to/id.css'],function(m){return m;});"
  });
  t.end();
});

test('alias rejects alias between ids with different extname', t => {
  t.throws(() => alias('from', 'to.json'));
  t.throws(() => alias('from.js', 'to.json'));
  t.throws(() => alias('from.html', 'to.htm'));
  t.end();
});

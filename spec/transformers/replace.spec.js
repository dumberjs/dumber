import test from 'tape';
import replace from '../../src/transformers/replace';

test('replace transform ignores empty replacement', t => {
  const source = `define('foo', ['require', 'module-a', './bar'], function (require) {
    require('module-a');
    require('./bar');
  })`;

  t.equal(replace(source, {}), source);
  t.end();
});

test('replace transform cleanup dep, even with empty replacement', t => {
  const source = `define('foo', ['require', 'module-a.js', './bar/', 'o/a.js'], function (require) {
    require('module-a.js');
    require('./bar/');
    require('o/a.js');
  })`;

  const result = `define('foo', ['require', 'module-a.js', './bar', 'o/a'], function (require) {
    require('module-a.js');
    require('./bar');
    require('o/a');
  })`;

  t.equal(replace(source, {}), result);
  t.end();
});

test('replace transform does replacement', t => {
  const source = `define('foo', ['require', 'module-a', './bar', './server/only.js'], function (require) {
    require('module-a');
    require('./bar');
    require('./server/only.js');
  })`;

  const replacement = {
    'module-a': '__ignore__',
    'module-b': './shims/module/b',
    './server/only': './shims/client-only'
  }

  const result = `define('foo', ['require', '__ignore__', './bar', './shims/client-only'], function (require) {
    require('__ignore__');
    require('./bar');
    require('./shims/client-only');
  })`;

  t.equal(replace(source, replacement), result);
  t.end();
});

test('replace transform does replace es6 module dep', t => {
  const source = `import a from 'module-a';
    import './bar/';
    import only, {client} from './server/only.js';`;

  const replacement = {
    'module-a': '__ignore__',
    'module-b': './shims/module/b',
    './server/only': './shims/client-only'
  }

  const result = `import a from '__ignore__';
    import './bar';
    import only, {client} from './shims/client-only';`

  t.equal(replace(source, replacement), result);
  t.end();
});

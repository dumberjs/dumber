import test from 'tape';
import wasm from '../../src/transformers/wasm';

test('wasm wraps wasm into amd module', t => {
  const source = 'abc';
  const target = "define('raw!a.wasm',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(\"abc\"));}}});";

  t.deepEqual(wasm({
    moduleId: 'a.wasm',
    contents: source,
    path: 'src/a.wasm'
  }), {
    defined: ['raw!a.wasm'],
    contents: target,
    deps: ['base64-arraybuffer'],
    sourceMap: {
      version: 3,
      file: 'src/a.wasm',
      sources: ['src/a.wasm'],
      mappings: 'AAAA',
      names: [],
      sourcesContent: [source]
    }
  });
  t.end();
});

test('wasm skips identity source map when there is existing map', t => {
  const source = 'abc';
  const target = "define('raw!a.wasm',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(\"abc\"));}}});";

  t.deepEqual(wasm({
    moduleId: 'a.wasm',
    contents: source,
    path: 'src/a.wasm',
    sourceMap: {
      version: 3,
      file: 'src/a.wasm',
      sources: ['src/a.wasm'],
      mappings: '',
      names: [],
      sourcesContent: [source]
    }
  }), {
    defined: ['raw!a.wasm'],
    contents: target,
    deps: ['base64-arraybuffer']
  });
  t.end();
});

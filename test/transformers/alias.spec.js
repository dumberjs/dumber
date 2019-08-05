const test = require('tape');
const alias = require('../../lib/transformers/alias');

test('alias creates aliases for js module', t => {
  t.deepEqual(alias({
    alias: 'from/id',
    defined: ['to/id'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id'],
    contents: "lorem\n;define.alias('from/id','to/id');"
  });
  t.deepEqual(alias({
    alias: 'from/id.js',
    defined: ['to/id'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id'],
    contents: "lorem\n;define.alias('from/id','to/id');"
  });
  t.deepEqual(alias({
    alias: 'from/id',
    defined: ['to/id.js'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id'],
    contents: "lorem\n;define.alias('from/id','to/id');"
  });
  t.deepEqual(alias({
    alias: 'from/id.js',
    defined: ['to/id.js'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id'],
    contents: "lorem\n;define.alias('from/id','to/id');"
  });
  t.end();
});

test('alias creates aliases for other modules', t => {
  t.deepEqual(alias({
    alias: 'from/id.json',
    defined: ['text!to/id.json'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['text!from/id.json'],
    contents: "lorem\n;define.alias('text!from/id.json','text!to/id.json');"
  });
  t.deepEqual(alias({
    alias: 'text!from/id.css',
    defined: ['text!to/id.css'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['text!from/id.css'],
    contents: "lorem\n;define.alias('text!from/id.css','text!to/id.css');"
  });
  t.deepEqual(alias({
    alias: 'from/id.wasm',
    defined: ['raw!to/id.wasm'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['raw!from/id.wasm'],
    contents: "lorem\n;define.alias('raw!from/id.wasm','raw!to/id.wasm');"
  });
  t.end();
});

test('alias rejects alias between ids with different extname', t => {
  t.throws(() => alias({
    alias: 'from/id',
    defined: ['to/id.json'],
    contents: 'lorem'
  }));
  t.throws(() => alias({
    alias: 'from/id.js',
    defined: ['to/id.json'],
    contents: 'lorem'
  }));
  t.throws(() => alias({
    alias: 'from/id.html',
    defined: ['to/id.htm'],
    contents: 'lorem'
  }));
  t.end();
});

test('alias ignores same alias', t => {
  t.deepEqual(alias({
    alias: 'to/id',
    defined: ['to/id'],
    contents: 'lorem'
  }), {
    alias: null
  });
  t.end();
});

test('multiple alias', t => {
  t.deepEqual(alias({
    alias: ['from/id', 'from/id2'],
    defined: ['to/id'],
    contents: 'lorem'
  }), {
    defined: ['from/id', 'from/id2'],
    contents: "lorem\n;define.alias('from/id','to/id');\n;define.alias('from/id2','to/id');",
    alias: null
  });
  t.end();
});
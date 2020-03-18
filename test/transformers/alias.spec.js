const test = require('tape');
const alias = require('../../lib/transformers/alias');

test('alias creates aliases for js module', t => {
  t.deepEqual(alias({
    moduleId: 'to/id',
    alias: 'from/id',
    defined: ['to/id'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id'],
    contents: "lorem\n;define.alias('from/id','to/id');"
  });
  t.deepEqual(alias({
    moduleId: 'to/id',
    alias: 'from/id.js',
    defined: ['to/id'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id.js'],
    contents: "lorem\n;define.alias('from/id.js','to/id');"
  });
  t.deepEqual(alias({
    moduleId: 'to/id.js',
    alias: 'from/id',
    defined: ['to/id.js'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id'],
    contents: "lorem\n;define.alias('from/id','to/id.js');"
  });
  t.deepEqual(alias({
    moduleId: 'to/id.js',
    alias: 'from/id.js',
    defined: ['to/id.js'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['from/id.js'],
    contents: "lorem\n;define.alias('from/id.js','to/id.js');"
  });
  t.end();
});

test('alias creates aliases for other modules', t => {
  t.deepEqual(alias({
    moduleId: 'to/id.json',
    alias: 'from/id.json',
    defined: ['text!to/id.json'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['text!from/id.json', 'from/id.json'],
    contents: "lorem\n;define.alias('text!from/id.json','text!to/id.json');\n;define.alias('from/id.json','to/id.json');"
  });
  t.deepEqual(alias({
    moduleId: 'to/id.css',
    alias: 'text!from/id.css',
    defined: ['text!to/id.css'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['text!from/id.css'],
    contents: "lorem\n;define.alias('text!from/id.css','text!to/id.css');"
  });
  t.deepEqual(alias({
    moduleId: 'to/id.wasm',
    alias: 'from/id.wasm',
    defined: ['raw!to/id.wasm'],
    contents: 'lorem'
  }), {
    alias: null,
    defined: ['raw!from/id.wasm', 'from/id.wasm'],
    contents: "lorem\n;define.alias('raw!from/id.wasm','raw!to/id.wasm');\n;define.alias('from/id.wasm','to/id.wasm');"
  });
  t.end();
});

test('alias ignores same alias', t => {
  t.deepEqual(alias({
    moduleId: 'to/id',
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
    moduleId: 'to/id',
    alias: ['from/id', 'from/id2'],
    defined: ['to/id', 'foo'],
    contents: 'lorem'
  }), {
    defined: ['from/id', 'from/id2'],
    contents: "lorem\n;define.alias('from/id','to/id');\n;define.alias('from/id2','to/id');",
    alias: null
  });
  t.end();
});
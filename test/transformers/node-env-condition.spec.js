const test = require('tape');
const nodeEnvCondition = require('../../lib/transformers/node-env-condition');

test('nodeEnvCondition does nothing for irrelevant code', t => {
  const contents = `import foo from './foo';
foo(function() {
  if (env !== 'production') {
    this.debugger();
  }
  if (a == b) {
    c();
  }
  this.start();
});
`;

  const result = nodeEnvCondition({contents, path: 'src/main.js'}, 'production');
  t.notOk(result);
  t.end();
});

test('nodeEnvCondition eliminates dead code in if condition', t => {
  const contents = `import foo from './foo';
foo(function() {
  if (process.env.NODE_ENV !== 'production') {
    this.debugger();
  }
  this.start();
});
`;

  const expected = `import foo from './foo';
foo(function() {
${'  ' /* leading space is retained */}
  this.start();
});
`;

  const result = nodeEnvCondition({contents, path: 'src/main.js'}, 'production');
  t.equal(result.contents, expected);
  t.end();
});

test('nodeEnvCondition replaces condition in if condition', t => {
  const contents = `import foo from './foo';
foo(function() {
  if (process.env['NODE_ENV'] !== 'production') {
    this.debugger();
  }
  this.start();
});
`;

  const expected = `import foo from './foo';
foo(function() {
  if (true) {
    this.debugger();
  }
  this.start();
});
`;

  const result = nodeEnvCondition({contents, path: 'src/main.js'}, 'development');
  t.equal(result.contents, expected);
  t.end();
});

test('nodeEnvCondition retains consequent branch in if-else condition', t => {
  const contents = `import foo from './foo';
foo(function() {
  if ('production' == process.env.NODE_ENV) {
    this.production();
  } else {
    this.debugger();
  }
  this.start();
});
`;

  const expected = `import foo from './foo';
foo(function() {
  if (true) {
    this.debugger();
  }
  this.start();
});
`;

  const result = nodeEnvCondition({contents, path: 'src/main.js'}, 'development');
  t.equal(result.contents, expected);
  t.end();
});

test('nodeEnvCondition retains alternate branch in if-else condition', t => {
  const contents = `import foo from './foo';
foo(function() {
  if ('production' == process.env["NODE_ENV"]) {
    this.production();
  } else {
    this.debugger();
  }
  this.start();
});
`;

  const expected = `import foo from './foo';
foo(function() {
  if (true) {
    this.production();
  }
  this.start();
});
`;

  const result = nodeEnvCondition({contents, path: 'src/main.js'}, 'production');
  t.equal(result.contents, expected);
  t.end();
});

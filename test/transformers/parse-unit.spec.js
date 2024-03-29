const {test} = require('zora');
const {parseUnit} = require('../../lib/transformers/parse-unit');

test('parseUnit reuses parsed', t => {
  const parsed = parseUnit({
    parsed: {lorem: 1},
    contents: 'var a = 1;'
  });
  t.deepEqual(parsed, {lorem: 1});
});

test('parseUnit parses unit contents', t => {
  const parsed = parseUnit({
    contents: 'var a = 1;'
  });
  t.equal(parsed.body[0].type, 'VariableDeclaration');
});

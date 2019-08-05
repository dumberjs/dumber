const test = require('tape');
const {dependencies} = require('../package.json');

test('readable-stream must be 2.3.6 to make stream-browserify working', t => {
  t.equal(dependencies['readable-stream'], '^2.3.6');
  t.end();
});

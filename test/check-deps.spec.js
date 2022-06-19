const {test} = require('zora');
const semver = require('semver');

test('readable-stream must be v3 to make stream-browserify v3 working', t => {
  t.equal(semver.major(require('readable-stream/package.json').version), 3);
  t.equal(semver.major(require('stream-browserify/package.json').version), 3);
});

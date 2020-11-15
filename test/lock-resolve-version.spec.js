// Note: fixed resolve version to 1.19.0 to avoid future support
// of field "exports" in package.json.
const test = require('tape');
const meta = require('resolve/package.json');

test('"resolve" package must be 1.19.0', t => {
  t.equal(meta.version, '1.19.0');
  t.end();
});

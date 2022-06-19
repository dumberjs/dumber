const {test} = require('zora');
const {fsReadFile, fsExists} = require('../lib/shared');

test('fsReadFile reads file', async t => {
  return fsReadFile('package.json')
    .then(
      result => {
        const json = JSON.parse(result);
        t.equal(json.name, 'dumber');
      },
      err => t.fail(err.message)
    );
});

test('fsReadFile rejects unknown file', async t => {
  return fsReadFile('unknown_file_name')
    .then(
      () => t.fail('should not succeed'),
      err => t.equal(err.code, 'ENOENT')
    );
});

test('fsReadFile rejects existing folder', async t => {
  return fsReadFile('lib')
    .then(
      () => t.fail('should not succeed'),
      err => t.equal(err.code, 'EISDIR')
    );
});

test('fsExists return true for existing file', async t => {
  return fsExists('package.json')
    .then(
      result => t.ok(result),
      err => t.fail(err.message)
    );
});

test('fsExists return false for unknown file', async t => {
  return fsExists('unknown_file_name')
    .then(
      result => t.notOk(result),
      err => t.fail(err.message)
    );
});

test('fsExists return false for existing folder', async t => {
  return fsExists('lib')
    .then(
      result => t.notOk(result),
      err => t.fail(err.message)
    );
});

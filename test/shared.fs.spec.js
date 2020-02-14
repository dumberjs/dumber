const test = require('tape');
const {fsReadFile, fsExists} = require('../lib/shared');

test('fsReadFile reads file', t => {
  fsReadFile('package.json')
    .then(
      result => {
        const json = JSON.parse(result);
        t.equal(json.name, 'dumber');
      },
      err => t.fail(err.message)
    )
    .then(t.end);
});

test('fsReadFile rejects unknown file', t => {
  fsReadFile('unknown_file_name')
    .then(
      () => t.fail('should not succeed'),
      err => t.equal(err.code, 'ENOENT')
    )
    .then(t.end);
});

test('fsReadFile rejects existing folder', t => {
  fsReadFile('lib')
    .then(
      () => t.fail('should not succeed'),
      err => t.equal(err.code, 'EISDIR')
    )
    .then(t.end);
});

test('fsExists return true for existing file', t => {
  fsExists('package.json')
    .then(
      result => t.ok(result),
      err => t.fail(err.message)
    )
    .then(t.end);
});

test('fsExists return false for unknown file', t => {
  fsExists('unknown_file_name')
    .then(
      result => t.notOk(result),
      err => t.fail(err.message)
    )
    .then(t.end);
});

test('fsExists return false for existing folder', t => {
  fsExists('lib')
    .then(
      result => t.notOk(result),
      err => t.fail(err.message)
    )
    .then(t.end);
});

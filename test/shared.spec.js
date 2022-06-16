const {test} = require('zora');
const {stripJsExtension, isPackageName, contentOrFile, generateHash, stripSourceMappingUrl, getSourceMap} = require('../lib/shared');
const {buildReadFile} = require('./mock');

test('stripJsExtension keeps other extension', t => {
  t.equal(stripJsExtension('a.json'), 'a.json');
  t.equal(stripJsExtension('./b/a.html'), './b/a.html');
  t.equal(stripJsExtension('foo/a.min'), 'foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.css'), '@bar/foo/a.css');
});

test('stripJsExtension strips js extension', t => {
  t.equal(stripJsExtension('a.js'), 'a');
  t.equal(stripJsExtension('a.ts'), 'a');
  t.equal(stripJsExtension('./b/a.js'), './b/a');
  t.equal(stripJsExtension('./b/a.jsx'), './b/a');
  t.equal(stripJsExtension('foo/a.min.js'), 'foo/a.min');
  t.equal(stripJsExtension('foo/a.min.tsx'), 'foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.min.js'), '@bar/foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.min.cjs'), '@bar/foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.min.mjs'), '@bar/foo/a.min');
});

test('isPackageName returns true for package name', t => {
  t.ok(isPackageName('foo'));
  t.ok(isPackageName('lorem-name'));
});

test('isPackageName returns true for scoped package name', t => {
  t.ok(isPackageName('@foo/bar'));
});

test('isPackageName returns false for relative module id', t => {
  t.notOk(isPackageName('./foo'));
  t.notOk(isPackageName('../foo/bar'));
  t.notOk(isPackageName('./@foo/bar'));
});

test('isPackageName returns false for sub id', t => {
  t.notOk(isPackageName('foo/bar'));
  t.notOk(isPackageName('@foo/bar/loo'));
});

test('contentOrFile returns passed js content, ensures end with semicolon', async t => {
  const content = 'var a = 1\n';

  return contentOrFile(content)
  .then(
    result => {
      t.deepEqual(result, {contents: 'var a = 1;'});
    },
    err => t.fail(err.message)
  );
});

test('contentOrFile reads remote js content', async t => {
  const url = 'https://cdn.jsdelivr.net/npm/os-browserify@0.3.0/browser.js';

  return contentOrFile(url)
  .then(
    result => {
      t.ok(result.contents.includes('hostname'));
      t.notOk(result.sourceMap);
      t.equal(result.path, 'cdn.jsdelivr.net/npm/os-browserify@0.3.0/browser.js');
    },
    err => t.fail(err.message)
  );
});

test('contentOrFile rejects wrong remote url', async t => {
  const url = 'https://cdn.jsdelivr.net/npm/os-browserify@0.3.0/no-file.js';

  return contentOrFile(url)
  .then(
    () =>  t.fail('should not succeed'),
    err => t.ok(true, err.message)
  );
});

test('contentOrFile reads local js file', async t => {
  const path = 'a.js';

  return contentOrFile(path, {readFile: buildReadFile({'a.js': 'var a;\n//# sourceMappingURL=data:application/json;base64,abc'})})
  .then(
    result => {
      t.equal(result.contents, 'var a;');
      t.equal(result.path, path);
      t.notOk(result.sourceMap);
    },
    err => t.fail(err.message)
  );
});

test('contentOrFile rejects missing local js file', async t => {
  const path = 'no-folder/no-file.js';

  return contentOrFile(path, {readFile: buildReadFile({'a.js': 'var a;'})})
  .then(
    () =>  t.fail('should not succeed'),
    err => t.ok(true, err.message)
  );
});

test('contentOrFile rejects invalid input', async t => {
  function toReject(p) {
    return p.then(
      () => t.fail('should not resolve'),
      err => t.ok(true, err.message)
    );
  }
  return Promise.all([
    toReject(contentOrFile()),
    toReject(contentOrFile(null)),
    toReject(contentOrFile('')),
    toReject(contentOrFile({path: 'lorem'}))
  ]);
});

test('generateHash generates hash', t => {
  t.ok(generateHash('lorem').match(/^[0-9a-f]{32}$/));
});

test('stripSourceMappingUrl does not strip sourceMappingURL inside js string', t => {
  const code = `"\\n/*# sourceMappingURL=data:application/json;base64,".concat(map," */");`;
  t.equal(stripSourceMappingUrl(code), code);
})

test('stripSourceMappingUrl strips js sourcemapping url', t => {
  t.equal(stripSourceMappingUrl('lorem\n'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n//# sourceMappingURL=data:application/json;base64,abc123'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n//# sourceMappingURL=data:application/json;base64,abc123\nfoo\n//# sourceMappingURL=data:application/json;base64,xyz'), 'lorem\n\nfoo\n');
});

test('stripSourceMappingUrl strips css sourcemapping url', t => {
  t.equal(stripSourceMappingUrl('lorem\n'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n/*# sourceMappingURL=data:application/json;base64,abc123 */'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n/*# sourceMappingURL=data:application/json;base64,abc123 */\nfoo\n/*# sourceMappingURL=data:application/json;base64,xyz */'), 'lorem\n\nfoo\n');
});

test('getSourceMap ignores file without sourceMap', t => {
  t.notOk(getSourceMap('', 'foo.js'));
  t.notOk(getSourceMap('var a = 1;', 'foo.js'));
});

test('getSourceMap gets inline sourceMap', t => {
  const sourceMap = {
    version: 3,
    file: 'foo.min.js',
    sources: ['../src/foo.js'],
    mappings: 'AAAA',
    names: []
  };
  const expectedSourceMap = {
    version: 3,
    file: 'node_modules/foo/dist/foo.min.js',
    sources: ['node_modules/foo/src/foo.js'],
    mappings: 'AAAA',
    names: []
  };
  const contents = 'var a = 1;\n//# sourceMappingURL=data:application/json;base64,' + Buffer.from(JSON.stringify(sourceMap)).toString('base64');
  t.deepEqual(getSourceMap(contents, 'node_modules/foo/dist/foo.min.js'), expectedSourceMap);
});

test('getSourceMap ignores broken inline sourceMap', t => {
  const contents = 'var a = 1;\n//# sourceMappingURL=data:application/json;base64,abc=';
  t.notOk(getSourceMap(contents, 'foo.js'));
});

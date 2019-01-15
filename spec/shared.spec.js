import test from 'tape';
import {stripJsExtension, isPackageName, contentOrFile, generateHash, stripSourceMappingUrl, getSourceMap} from '../src/shared';
import {buildReadFile} from './mock';

test('stripJsExtension keeps other extension', t => {
  t.equal(stripJsExtension('a.json'), 'a.json');
  t.equal(stripJsExtension('./b/a.html'), './b/a.html');
  t.equal(stripJsExtension('foo/a.min'), 'foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.css'), '@bar/foo/a.css');
  t.end();
});

test('stripJsExtension strips js extension', t => {
  t.equal(stripJsExtension('a.js'), 'a');
  t.equal(stripJsExtension('./b/a.js'), './b/a');
  t.equal(stripJsExtension('foo/a.min.js'), 'foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.min.js'), '@bar/foo/a.min');
  t.end();
});

test('isPackageName returns true for package name', t => {
  t.ok(isPackageName('foo'));
  t.ok(isPackageName('lorem-name'));
  t.end();
});

test('isPackageName returns true for scoped package name', t => {
  t.ok(isPackageName('@foo/bar'));
  t.end();
});

test('isPackageName returns false for relative module id', t => {
  t.notOk(isPackageName('./foo'));
  t.notOk(isPackageName('../foo/bar'));
  t.notOk(isPackageName('./@foo/bar'));
  t.end();
});

test('isPackageName returns false for sub id', t => {
  t.notOk(isPackageName('foo/bar'));
  t.notOk(isPackageName('@foo/bar/loo'));
  t.end();
});

test('contentOrFile returns passed js content, ensures end with semicolon', t => {
  const content = 'var a = 1\n';

  contentOrFile(content)
  .then(
    result => {
      t.equal(result.contents, 'var a = 1;');
      t.notOk(result.path);
    },
    err => t.fail(err.message)
  )
  .then(t.end);
});

test('contentOrFile reads remote js content', t => {
  const url = 'https://cdn.jsdelivr.net/npm/os-browserify@0.3.0/browser.js';

  contentOrFile(url)
  .then(
    result => {
      t.ok(result.contents.includes('hostname'));
      t.notOk(result.path);
    },
    err => t.fail(err.message)
  )
  .then(t.end);
});

test('contentOrFile rejects wrong remote url', t => {
  const url = 'https://cdn.jsdelivr.net/npm/os-browserify@0.3.0/no-file.js';

  contentOrFile(url)
  .then(
    () =>  t.fail('should not succeed'),
    err => t.pass(err.message)
  )
  .then(t.end);
});

test('contentOrFile reads local js file', t => {
  const path = 'a.js';

  contentOrFile(path, {readFile: buildReadFile({'a.js': 'var a;\n//# sourceMappingURL=abc'})})
  .then(
    result => {
      t.equal(result.contents, 'var a;');
      t.equal(result.path, path);
    },
    err => t.fail(err.message)
  )
  .then(t.end);
});

test('contentOrFile rejects missing local js file', t => {
  const path = 'no-folder/no-file.js';

  contentOrFile(path, {readFile: buildReadFile({'a.js': 'var a;'})})
  .then(
    () =>  t.fail('should not succeed'),
    err => t.pass(err.message)
  )
  .then(t.end);
});

test('contentOrFile rejects invalid input', t => {
  function toReject(p) {
    return p.then(
      () => t.fail('should not resolve'),
      err => t.pass(err.message)
    );
  }
  Promise.all([
    toReject(contentOrFile()),
    toReject(contentOrFile(null)),
    toReject(contentOrFile('')),
    toReject(contentOrFile({path: 'lorem'}))
  ]).then(() => t.end());
});

test('generateHash generates hash', t => {
  t.ok(generateHash('lorem').match(/^[0-9a-f]{32}$/));
  t.end();
});

test('stripSourceMappingUrl strips js sourcemapping url', t => {
  t.equal(stripSourceMappingUrl('lorem\n'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n//# sourceMappingURL=abc123'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n//# sourceMappingURL=abc123\nfoo\n//# sourceMappingURL=xyz'), 'lorem\n\nfoo\n');
  t.end();
});

test('stripSourceMappingUrl strips css sourcemapping url', t => {
  t.equal(stripSourceMappingUrl('lorem\n'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n/*# sourceMappingURL=abc123 */'), 'lorem\n');
  t.equal(stripSourceMappingUrl('lorem\n/*# sourceMappingURL=abc123 */\nfoo\n/*# sourceMappingURL=xyz */'), 'lorem\n\nfoo\n');
  t.end();
});

test('getSourceMap ignores file without sourceMap', t => {
  t.notOk(getSourceMap('', 'foo.js'));
  t.notOk(getSourceMap('var a = 1;', 'foo.js'));
  t.end();
});

test('getSourceMap gets inline sourceMap', t => {
  const contents = 'var a = 1;\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQvZm9vLm1pbi5qcyIsInNvdXJjZXMiOlsic3JjL2Zvby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIvIn0=';
  const sourceMap = {"version":3,"file":"build/foo.min.js","sources":["src/foo.js"],"names":[],"mappings":"AAAA","sourceRoot":"/"};
  t.deepEqual(getSourceMap(contents, 'foo.js'), sourceMap);
  t.end();
});

test('getSourceMap ignores broken inline sourceMap', t => {
  const contents = 'var a = 1;\n//# sourceMappingURL=data:application/json;base64,abc=';
  t.notOk(getSourceMap(contents, 'foo.js'));
  t.end();
});

if (typeof global.document === 'undefined') {
  // no test in browser
  test('getSourceMap gets referenced sourceMap file content', t => {
    let contents = `
  .header {
    background: #444;
    border: solid;
    padding: 10px;
    border-radius: 10px 5px 10px 5px;
    color: #b4b472; }

  #main li {
    color: green;
    margin: 10px;
    padding: 10px;
    font-size: 18px; }

  `;
    contents += '\n//# sourceMappingURL=map-file-comment.css.map\n';
    const sourceMap = {
      "version": "3",
      "mappings": "AAAA,wBAAyB;EACvB,UAAU,EAAE,IAAI;EAChB,MAAM,EAAE,KAAK;EACb,OAAO,EAAE,IAAI;EACb,aAAa,EAAE,iBAAiB;EAChC,KAAK,EAAE,OAAkB;;AAG3B,wBAAyB;EACvB,OAAO,EAAE,IAAI;;ACTf,gBAAiB;EACf,UAAU,EAAE,IAAI;EAChB,KAAK,EAAE,MAAM;;AAGf,kBAAmB;EACjB,MAAM,EAAE,IAAI;EACZ,OAAO,EAAE,IAAI;EACb,UAAU,EAAE,KAAK;EACjB,aAAa,EAAE,GAAG;EAClB,KAAK,EAAE,KAAK;;AAEd,kBAAmB;EACjB,KAAK,EAAE,KAAK;;AAGd,mBAAoB;EAClB,KAAK,EAAE,KAAK;EACZ,MAAM,EAAE,IAAI;EACZ,OAAO,EAAE,IAAI;EACb,SAAS,EAAE,IAAI",
      "sources": ["./client/sass/core.scss","./client/sass/main.scss"],
      "file": "map-file-comment.css"
    };

    t.deepEqual(getSourceMap(contents, 'spec/map-file-comment.css'), sourceMap);
    t.end();
  });

  test('getSourceMap ignores missing sourceMap file', t => {
    let contents = `
  .header {
    background: #444;
    border: solid;
    padding: 10px;
    border-radius: 10px 5px 10px 5px;
    color: #b4b472; }

  #main li {
    color: green;
    margin: 10px;
    padding: 10px;
    font-size: 18px; }

  `;
    contents += '\n//# sourceMappingURL=missing.css.map\n';
    t.notOk(getSourceMap(contents, 'spec/map-file-comment.css'));
    t.end();
  });
}
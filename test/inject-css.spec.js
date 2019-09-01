const test = require('tape');
const {fixupCSSUrls, splitCssModuleExports} = require('../lib/inject-css');

// tests partly copied from
// https://github.com/webpack-contrib/style-loader/blob/master/test/fixUrls.test.js
test('fixupCSSUrls throws on null/undefined', t => {
  t.throws(() => fixupCSSUrls('foo/bar', null));
  t.throws(() => fixupCSSUrls('foo/bar', undefined));
  t.end();
});

test('fixupCSSUrls: Blank css is not modified', t => {
  const css = '';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test('fixupCSSUrls: No url is not modified', t => {
  const css = 'body { }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Full url isn't changed (no quotes)", t => {
  const css = 'body { background-image:url ( http://example.com/bg.jpg  ); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Full url isn't changed (no quotes, spaces)", t => {
  const css = 'body { background-image:url ( http://example.com/bg.jpg  ); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Full url isn't changed (double quotes)", t => {
  const css = 'body { background-image:url("http://example.com/bg.jpg"); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Full url isn't changed (double quotes, spaces)", t => {
  const css = 'body { background-image:url ( "http://example.com/bg.jpg" ); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Full url isn't changed (single quotes)", t => {
  const css = 'body { background-image:url(\'http://example.com/bg.jpg\'); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Full url isn't changed (single quotes, spaces)", t => {
  const css = 'body { background-image:url ( \'http://example.com/bg.jpg\' ); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test('fixupCSSUrls: Multiple full urls are not changed', t => {
  const css = "body { background-image:url(http://example.com/bg.jpg); }\ndiv.main { background-image:url ( 'https://www.anothersite.com/another.png' ); }";
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Http url isn't changed", t => {
  const css = 'body { background-image:url(http://example.com/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Https url isn't changed", t => {
  const css = 'body { background-image:url(https://example.com/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: HTTPS url isn't changed", t => {
  const css = 'body { background-image:url(HTTPS://example.com/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: File url isn't changed", t => {
  const css = 'body { background-image:url(file:///example.com/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Double slash url isn't changed", t => {
  const css = 'body { background-image:url(//example.com/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Image data uri url isn't changed", t => {
  const css = 'body { background-image:url(data:image/png;base64,qsrwABYuwNkimqm3gAAAABJRU5ErkJggg==); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Font data uri url isn't changed", t => {
  const css = 'body { background-image:url(data:application/x-font-woff;charset=utf-8;base64,qsrwABYuwNkimqm3gAAAABJRU5ErkJggg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test('fixupCSSUrls: Relative url with dot slash', t => {
  const css = 'body { background-image:url(./c/d/bg.jpg); }';
  const expected = "body { background-image:url('foo/c/d/bg.jpg'); }";
  t.equal(fixupCSSUrls('foo/bar', css), expected);
  t.end();
});

test('fixupCSSUrls: Multiple relative urls', t => {
  const css = 'body { background-image:URL ( "./bg.jpg" ); }\ndiv.main { background-image:url(../c/d/bg.jpg); }';
  const expected = "body { background-image:url('foo/bg.jpg'); }\ndiv.main { background-image:url('c/d/bg.jpg'); }";
  t.equal(fixupCSSUrls('foo/bar', css), expected);
  t.end();
});

test("fixupCSSUrls: url with hash isn't changed", t => {
  const css = 'body { background-image:url(#bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test('fixupCSSUrls: Empty url should be skipped', t => {
  let css = 'body { background-image:url(); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url( ); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url(\n); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url(\'\'); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url(\' \'); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url(""); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url(" "); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls: Rooted url isn't changed", t => {
  let css = 'body { background-image:url(/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  css = 'body { background-image:url(/a/b/bg.jpg); }';
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls doesn't break inline SVG", t => {
  const css = "body { background-image:url('data:image/svg+xml;charset=utf-8,<svg><feFlood flood-color=\"rgba(0,0,0,0.5)\" /></svg>'); }";
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test("fixupCSSUrls doesn't break inline SVG with HTML comment", t => {
  const css = "body { background-image:url('data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0A%3C!--%20Comment%20--%3E%0A%3Csvg%3E%3C%2Fsvg%3E%0A'); }";
  t.equal(fixupCSSUrls('foo/bar', css), css);
  t.end();
});

test('splitCssModuleExports returns original contents when css-module is not detected', t => {
  t.deepEqual(splitCssModuleExports(), {css: ''});
  t.deepEqual(splitCssModuleExports('.a { color: red; }'), {css: '.a { color: red; }'});
  t.end();
});

test('splitCssModuleExports splits css-module exports', t => {
  const css = '._a_1vkqw_1 { color: red; }\n/* dumber-css-module: {"a":"_a_1vkqw_1"} */\n';
  t.deepEqual(splitCssModuleExports(css), {
    css: '._a_1vkqw_1 { color: red; }\n',
    exportTokens: {a: '_a_1vkqw_1'}
  });
  t.end();
});

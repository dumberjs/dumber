// Only use gulp-dumber to compile browser-test code
const gulp = require('gulp');
const dumber = require('gulp-dumber');
const fs = require('fs');

const dr = dumber({
  src: 'lib',
  append: ["requirejs(['../test/all-browser-spec.js'], function() { console.log('# tests loaded')});"],
  // append: ["requirejs(['../test/transform.spec.js'], function() { console.log('# tests loaded')});"],
  onRequire(moduleId) {
    if (moduleId === '@parcel/source-map/parcel_sourcemap_wasm/dist-web/parcel_sourcemap_wasm.js') {
      const content = fs.readFileSync(require.resolve(moduleId), 'utf8');
      const patched = content.replace(/new URL\((?:'|")parcel_sourcemap_wasm_bg.wasm(?:'|"),\s*import.meta.url\)/, 'new URL("https://cdn.jsdelivr.net/npm/@parcel/source-map@2.0.5/parcel_sourcemap_wasm/dist-web/parcel_sourcemap_wasm_bg.wasm");');
      return patched;
    }
  }
});

exports.default = function build() {
  return gulp.src(['test/**/*.js', 'lib/**/*.js', 'package.json'], { sourcemaps: true})
    .pipe(dr())
    .pipe(gulp.dest('dist', { sourcemaps: true }));
};

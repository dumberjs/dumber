const {parse} = require('dumber-module-loader/dist/id-utils');

const DIST_FOLDERS = ['dist', 'dists', 'output', 'out', 'lib', 'libs'];
const DIST_FAVORS = ['amd', 'cjs', 'commonjs', 'native-module', 'native-modules', 'esm', 'umd',
  'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es3', 'es5', 'es6', 'es7', 'es8', 'es9', 'es10'];

// conventional alias mainly for aurelia
// aurelia-foo/dist/cjs/bar -> aurelia-foo/bar

// only for npm file and defined a single module
module.exports = function conventionalAlias(unit) {
  const {defined, packageName, packageMainPath} = unit;
  if (!packageName) return;
  if (!defined || !defined.length) return;
  if (defined.length > 1) return;

  const {parts} = parse(defined[0]);
  let toSkip = 0;

  if (parts.length > 2 &&
      DIST_FOLDERS.indexOf(parts[1].toLowerCase()) !== -1 &&
      packageMainPath.startsWith(parts[1])) {
    toSkip = 1;
    if (parts.length > 3 &&
        DIST_FAVORS.indexOf(parts[2].toLowerCase()) !== -1 &&
        packageMainPath.slice(parts[1].length + 1).startsWith(parts[2])) {
      toSkip = 2;
    }
  }

  if (toSkip) {
    const shortId = packageName + '/' + parts.slice(toSkip + 1).join('/');
    return {alias: shortId};
  }
};

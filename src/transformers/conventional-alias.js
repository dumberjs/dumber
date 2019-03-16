import {parse} from 'dumber-module-loader/dist/id-utils';

const DIST_FOLDERS = ['dist', 'dists', 'output', 'out', 'lib', 'libs'];
const DIST_FAVORS = ['amd', 'cjs', 'commonjs', 'es2015', 'native-modules', 'umd'];

// conventional alias mainly for aurelia
// aurelia-foo/dist/cjs/bar -> aurelia-foo/bar

// only for npm file and defined a single module
export default function(unit) {
  const {defined, packageName} = unit;
  if (!packageName) return;
  if (!defined || !defined.length) return;
  if (defined.length > 1) return;

  const {parts} = parse(defined[0]);
  let toSkip = 0;

  if (parts.length > 2 && DIST_FOLDERS.indexOf(parts[1].toLowerCase()) !== -1) {
    toSkip = 1;
    if (parts.length > 3 && DIST_FAVORS.indexOf(parts[2].toLowerCase()) !== -1) {
      toSkip = 2;
    }
  }

  if (toSkip) {
    const shortId = packageName + '/' + parts.slice(toSkip + 1).join('/');
    return {alias: shortId};
  }
}

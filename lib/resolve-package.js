const path = require('path');
const resolve = require('resolve');
const cwd = process.cwd();

// Previously, we use require.resolve(packageName + '/package.json')
// to find the package's meta file.
// But new field "exports" in package.json might now prevent resolving
// '/package.json'.
// So we have to use custom method to manually search the package.
// Note some npm package (like font-awesome v4) has no main file,
// so require.resolve(packageName) may not work too.
// Note: fixed resolve version to 1.19.0 to avoid future support
// of field "exports" in package.json.
module.exports = function(packageName) {
  let metaPath;
  // we resolve package.json instead of package's main file,
  // as some npm package (like font-awesome v4) has no main file.
  const packageJson = packageName + '/package.json';

  try {
    try {
      // try from dumber first
      metaPath = resolve.sync(packageJson);
    } catch (e) {
      // try from app's local folder, this is necessary to support lerna
      // hoisting where dumber is out of app's local node_modules folder.
      metaPath = resolve.sync(packageJson, {basedir: cwd});
    }
  } catch (e) {
    throw new Error('cannot find npm package: ' + packageName);
  }
  return path.relative(cwd, metaPath.slice(0, -13));
};

const path = require('path');
const resolve = require('resolve');
const cwd = process.cwd();

module.exports = function(packageName) {
  let metaPath;
  // we resolve package.json instead of package's main file,
  // as some npm package (like font-awesome v4) has no main file.
  const packageJson = packageName + '/package.json';

  try {
    try {
      // try from dumber first
      metaPath = require.resolve(packageJson);
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

const path = require('path');
const fs = require('fs');
const cwd = process.cwd();

// Previously, we use require.resolve(packageName + '/package.json')
// to find the package's meta file.
// But new field exports in package.json might now prevent resolving
// '/package.json'.
// So we have to use custom method to manually search the package.
// Note some npm package (like font-awesome v4) has no main file,
// so require.resolve(packageName) may not work too.
function packageFolder(packageName, fromDir) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const testDir = path.join(fromDir, 'node_modules', packageName);
    if (fs.existsSync(path.join(testDir, 'package.json'))) {
      return testDir;
    }
    const parentDir = path.dirname(fromDir);
    if (parentDir === fromDir) return;
    fromDir = parentDir;
  }
}

module.exports = function(packageName) {
  const found =
    // try from dumber first
    packageFolder(packageName, __dirname) ||
    // try from app's local folder, this is necessary to support lerna
    // hoisting where dumber is out of app's local node_modules folder.
    packageFolder(packageName, cwd);

  if (!found) {
    throw new Error('cannot find npm package: ' + packageName);
  }
  return found;
};

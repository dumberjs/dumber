const path = require('path');
const {existsSync} = require('fs');
const cwd = process.cwd();

function packagePath(packageName, dir) {
  const folder = path.join(dir, 'node_modules', packageName);
  if (existsSync(path.join(folder, 'package.json'))) {
    return folder;
  }
  const parent = path.dirname(dir);
  if (parent === dir) return;
  return packagePath(packageName, parent);
}

module.exports = function(packageName) {
  // try from dumber first
  const location = packagePath(packageName, __dirname) ||
    // try from app's local folder, this is necessary to support lerna
    // hoisting where dumber is out of app's local node_modules folder.
    packagePath(packageName, cwd);

  if (!location) {
    throw new Error('cannot find npm package: ' + packageName);
  }
  return path.relative(cwd, location);
};

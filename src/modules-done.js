// Retain all traced module ids in bundler
import {nodejsIds} from 'dumber-module-loader/dist/id-utils';

export default class ModulesDone {
  constructor() {
    this.userIds = new Set();
    this.packageIds = new Set();
  }

  addUnit(unit) {
    this.add(unit.moduleId, !!unit.packageName);
    this.add(unit.defined, !!unit.packageName);
  }

  add(id, inPackageSpace) {
    if (typeof id === 'string') {
      if (inPackageSpace) {
        this.packageIds.add(id);
      } else {
        this.userIds.add(id);
      }
    } else if (Array.isArray(id)) {
      id.forEach(d => this.add(d, inPackageSpace));
    }
  }

  // incoming id is a parsed bareId
  has(id, checkUserSpace, checkPackageSpace) {
    const possibleIds = nodejsIds(id);

    return possibleIds.some(id => {
      let inUserSpace = checkUserSpace && this.userIds.has(id);
      let inPackageSpace = checkPackageSpace && this.packageIds.has(id);
      return inUserSpace || inPackageSpace;
    });
  }
}

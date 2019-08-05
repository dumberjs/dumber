// Temporarily retain all modules todo in bundler
const {parse, resolveModuleId} = require('dumber-module-loader/dist/id-utils');

const USER = '0';
const PACKAGE = '1';
const USER_OR_PACKAGE = '2';

module.exports = class ModulesTodo {
  constructor() {
    this._reset();
  }

  _reset() {
    // {'0:id': ['required_by_ids']}
    this.todos = Object.create(null);
  }

  hasTodo() {
    return Object.keys(this.todos).length > 0;
  }

  // add deps from tracedUnit
  process(unit) {
    const {moduleId, packageName, deps} = unit;

    deps.forEach(d => {
      const parsedId = parse(resolveModuleId(moduleId, d));

      if (!parsedId.prefix && (
          parsedId.ext === '.css' ||
          parsedId.ext === '.less' ||
          parsedId.ext === '.scss' ||
          parsedId.ext === '.sass' ||
          parsedId.ext === '.styl'
        )) {
        this.needCssInjection = true;
      }

      let space;
      if (packageName) {
        space = PACKAGE;
      } else if (isRelative(d)) {
        // local relative
        space = USER;
      } else {
        space = USER_OR_PACKAGE;
      }

      if (parsedId.prefix &&
          parsedId.prefix !== 'text!' &&
          parsedId.prefix !== 'json!' &&
          parsedId.prefix !== 'raw!') {
        // Trace any unknown plugin module.
        // For simplicity, push it to next resolve cycle.
        const pluginName = parsedId.prefix.slice(0, -1);

        let pluginSpace = space;
        if (space !== PACKAGE) pluginSpace = USER_OR_PACKAGE;
        const key = pluginSpace + ':' + pluginName;
        if (!this.todos[key]) this.todos[key] = [];
        this.todos[key].push(moduleId);
      }

      const key = space + ':' + parsedId.cleanId;
      if (!this.todos[key]) this.todos[key] = [];
      this.todos[key].push(moduleId);
    });
  }

  // call the cb to acquire missing deps
  acquire(cb) {
    if (Object.keys(this.todos).length === 0) {
      return Promise.resolve();
    }

    const {todos} = this;
    this._reset();

    let p = Promise.resolve();

    Object.keys(todos).sort().forEach(key => {
      const [space, id] = spaceAndId(key);
      const requiredBy = todos[key];

      p = p.then(() => cb(id, {
        user: space !== PACKAGE,
        package: space !== USER,
        requiredBy
      }));
    });

    return p;
  }
};

function spaceAndId(key) {
  return [key.slice(0, 1), key.slice(2)];
}

function isRelative(id) {
  return parse(id).bareId.startsWith('.');
}

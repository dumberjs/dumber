import trace from './trace';
import {parse, nodejsIds} from 'dumber-module-loader/dist/id-utils';
import alias from './transformers/alias';
import defaultPackageLocator from './package-locators/default';
import PackageReader from './package-reader';
import Package from './package';
import stubModule from './stub-module';
import {error, warn, stripJsExtension, resolvePackagePath, contentOrFile} from './shared';
import * as cache from './cache/default';
import path from 'path';
import mergeTransformed from './transformers/merge';

// Bundler does
// 1. capture: capture units (unit is a file like object plus meta data)
// 2. resolve: resolve all dependencies
// 3. bundle: write to bundles (objs, not final file contents)

// gulp-dumber or dumberify will then process bundles objects to files

export default class Bundler {
  constructor(opts, mock) {
    opts = opts || {};
    // decoupling for testing
    this._trace = (mock && mock.trace) || trace;
    let _resolve = (mock && mock.resolve) || resolvePackagePath;
    this._contentOrFile = (mock && mock.contentOrFile) || contentOrFile;

    if (opts.hasOwnProperty('cache')) {
      if (opts.cache === false) {
        this._cache = null;
      } else if (opts.cache.getCache && opts.cache.setCache && opts.cache.clearCache) {
        this._cache = opts.cache;
      } else {
        // turn on cache by default
        this._cache = cache;
      }
    } else {
      // turn on cache by default
      this._cache = cache;
    }

    this._unitsMap = {};
    this._moduleId_done = new Set();
    this._moduleIds_todo = new Set();
    this._readersMap = {};
    this._locator = opts.packageLocator || defaultPackageLocator;

    // baseUrl default to "dist"
    this._baseUrl = opts.baseUrl || 'dist';
    this._depsFinder = opts.depsFinder;
    this._onRequire = opts.onRequire || opts.onrequire || opts.onRequiringModule;

    this._prepends = opts.prepends || opts.prepend || [];
    this._prepends.push(
      // load dumber-module-loader after prepends
      path.join(_resolve('dumber-module-loader'), 'dist/index.js')
    );
    this._appends = opts.appends || opts.append || [];

    this._dependencies = (opts.dependencies || opts.deps || []).map(d => new Package(d));
    this._entryBundle = stripJsExtension(opts.entryBundle) || 'entry-bundle';
    this._codeSplit = opts.codeSplit || function(){};
    // mark dirtiness of bundles
    this.dirty = {[this._entryBundle]: true};
    // persist bundles in watch mode
    this._bundles = {};
  }

  clearCache() {
    this._cache && this._cache.clearCache();
  }

  packageReaderFor(packageConfig) {
    if (this._readersMap.hasOwnProperty(packageConfig.name)) {
      return Promise.resolve(this._readersMap[packageConfig.name]);
    }

    return this._locator(packageConfig).then(locator => {
      const reader = new PackageReader(locator);
      this._readersMap[packageConfig.name] = reader;
      return reader;
    });
  }

  shimFor(packageName) {
    const dep = this._dependencies.find(d => d.name === packageName);
    if (dep) return dep.shim;
  }

  bundleOf(unit) {
    const bundleName = this._codeSplit(unit.moduleId, unit.packageName);
    if (!bundleName) return this._entryBundle;
    return stripJsExtension(bundleName);
  }

  capture(unit) {
    if (unit.packageName) {
      unit.shim = this.shimFor(unit.packageName);
    }

    // return tracedUnit
    return this._trace(unit, {
      cache: this._cache,
      depsFinder: this._depsFinder
    }).then(
      tracedUnit => this._capture(tracedUnit),
      err => error(err)
    );
  }

  _addToDone(id) {
    if (typeof id === 'string') {
      this._moduleId_done.add(id);
    } else if (Array.isArray(id)) {
      id.forEach(d => this._moduleId_done.add(d));
    }
  }

  _capture(tracedUnit) {
    this._unitsMap[tracedUnit.path] = tracedUnit;

    // mark as done.
    this._addToDone(tracedUnit.moduleId);
    this._addToDone(tracedUnit.defined);

    // mark todo. beware we didn't check whether the id is in _moduleId_done.
    // they will be checked during resolve phase.

    // console.log('_capture ' + tracedUnit.moduleId + ' deps ' + tracedUnit.deps);
    tracedUnit.deps.forEach(d => this._moduleIds_todo.add(d));

    const bundle = this.bundleOf(tracedUnit);
    // mark related bundle dirty
    tracedUnit.bundle = bundle;
    this.dirty[bundle] = true;

    return tracedUnit;
  }

  _resolveExplicitDepsIfNeeded() {
    if (this.isExplicitDepsResolved) return Promise.resolve();
    this.isExplicitDepsResolved = true;

    // console.log('_resolveExplicitDepsIfNeeded');
    let p = Promise.resolve();

    this._dependencies.forEach(pkg => {
      p = p.then(() => this.packageReaderFor(pkg)).then(reader => {
        if (!pkg.lazyMain) {
          // console.log('to readMain for ' + pkg.name);
          return reader.readMain()
          .then(unit => this.capture(unit))
          .then(tracedUnit => {
            this._ensureNpmMainAlias(tracedUnit, pkg.name);
          });
        }
      });
    });

    return p;
  }

  _resolvePrependsAndAppends() {
    if (this.isPrependsAndAppendsResolved) return Promise.resolve();
    this.isPrependsAndAppendsResolved = true;

    let {_prepends, _appends} = this;
    let prepends = new Array(_prepends.length);
    let appends = new Array(_appends.length);

    return Promise.all([
      ..._prepends.map((p, i) => this._contentOrFile(p).then(f => prepends[i] = f)),
      ..._appends.map((p, i) => this._contentOrFile(p).then(f => appends[i] = f)),
    ]).then(() => {
      this._prepends = prepends;
      this._appends = appends;
    })
  }

  _ensureNpmMainAlias(tracedUnit, id) {
    if (this._moduleId_done.has(id)) return;

    const defined = tracedUnit.defined;
    let toId;
    if (Array.isArray(defined)) {
      const ds = defined.map(d => parse(d).bareId);
      if (ds.indexOf(id) !== -1) return;
      toId = ds[0];
    } else if (typeof defined === 'string') {
      toId = parse(defined).bareId;
    }

    // alias to main is also created here
    if (!toId) warn('no defined module found in ' + tracedUnit.path);

    // only create alias when defined id is not same as package name
    if (toId !== id && toId !== tracedUnit.packageName) {
      const aliasResult = alias(id, toId);
      mergeTransformed(tracedUnit, aliasResult);
      this._addToDone(aliasResult.defined);
    }
  }

  resolve() {
    let todo = [];
    return this._resolvePrependsAndAppends()
    .then(() => this._resolveExplicitDepsIfNeeded())
    .then(() => {
      const consults = [];
      const rawTodo = Array.from(this._moduleIds_todo);
      this._moduleIds_todo.clear();


      // console.log('_moduleIds_todo', this._moduleIds_todo);
      rawTodo.forEach(id => {
        const parsedId = parse(id);
        const possibleIds = nodejsIds(parsedId.bareId);
        if (possibleIds.some(id => this._moduleId_done.has(id))) return;

        const j = new Promise(resolve => {
          resolve(this._onRequire && this._onRequire(parsedId.bareId, parsedId));
        }).then(
          result => {
            // ignore this module id
            if (result === false) return;

            // require other module ids instead
            if (Array.isArray(result) && result.length) {
              result.forEach(d => todo.push(parse(d)));
              return;
            }

            // got full content of this module
            if (typeof result === 'string') {
              return this.capture({
                path: '__on_require__/' + parsedId.bareId,
                contents: result,
                moduleId: parsedId.bareId
              });
            }

            // process normally if result is not recognizable
            todo.push(parsedId);
          },
          // proceed normally after error
          err => {
            error(err);
            todo.push(parsedId);
          }
        );
        consults.push(j);
      });

      if (consults.length) return Promise.all(consults);
    })
    .then(() => {

      let p = Promise.resolve();

      // console.log('todo', todo.map(t => t.cleanId));

      todo.forEach(td => {
        const bareId = td.bareId;
        const packageName = td.parts[0];
        const resource = bareId.slice(packageName.length + 1);

        const stub = stubModule(bareId);

        if (typeof stub === 'string') {
          p = p.then(() => this.capture({
            // not a real file path
            path:'__stub__/' + bareId,
            contents: stub,
            moduleId: bareId,
            packageName
          }));
        } else {
          p = p.then(() => this.packageReaderFor(stub || {name: packageName}))
          .then(reader => resource ? reader.readResource(resource) : reader.readMain())
          .then(unit => this.capture(unit))
          .then(tracedUnit => {
            if (!resource) {
              this._ensureNpmMainAlias(tracedUnit, bareId);
            }
          })
          .catch(err => {
            error(err);
          });
        }
      });

      return p;
    })
    .then(() => {
      if (this._moduleIds_todo.size) {
        return this.resolve();
      }
    });
  }

  _unitsForBundle(bundle) {
    let units = [];

    Object.keys(this._unitsMap).forEach(filePath => {
      const unit = this._unitsMap[filePath];
      if (unit.bundle === bundle) units.push(unit);
    });

    // Alphabetical sorting based on moduleId
    units.sort((a, b) => {
      if (a.moduleId > b.moduleId) return 1;
      if (b.moduleId > a.moduleId) return -1;
      return 0;
    });

    // Topological sort for shim packages
    const sorted = [];
    const visited = {};

    const visit = file => {
      const {moduleId, deps, shimed} = file;
      if (visited[moduleId]) return;
      visited[moduleId] = true;

      if (shimed && deps) {
        deps.forEach(packageName => {
          units.filter(u => u.packageName === packageName).forEach(visit);
        });
      }

      sorted.push(file);
    };

    units.forEach(visit);
    return sorted;
  }

  // return promise of a map
  // {
  //   'bundle-name' : {files: [{path, contents, sourceMap}]},
  //   'bunele-entry-name': {files: [{path, contents, sourceMap}], config: {...}},
  // }
  bundle() {
    Object.keys(this.dirty).forEach(bundle => {
      const files = [];

      const userSpaceUnits = [];
      const packageSpaceUnits = [];
      const userSpaceModuleIds = new Set();
      const packageSpaceModuleIds = new Set();

      this._unitsForBundle(bundle).forEach(unit => {
        if (unit.packageName) {
          packageSpaceUnits.push(unit);
        } else {
          userSpaceUnits.push(unit);
        }
      });

      if (bundle === this._entryBundle) {
        // write prepends
        this._prepends.forEach(f => files.push(f));
      }

      if (userSpaceUnits.length) {
        // write userSpaceUnits
        files.push({contents: 'define.switchToUserSpace();'});

        userSpaceUnits.forEach(unit => {
          files.push({
            path: unit.path,
            contents: unit.contents,
            sourceMap: unit.sourceMap
          });
          userSpaceModuleIds.add(unit.moduleId);
          if (typeof unit.defined === 'string') {
            userSpaceModuleIds.add(unit.defined);
          } else if (Array.isArray(unit.defined)) {
            unit.defined.forEach(d => userSpaceModuleIds.add(d));
          }
        });
      }

      if (packageSpaceUnits.length) {
        // write packageSpaceUnits
        files.push({contents: 'define.switchToPackageSpace();'});
        packageSpaceUnits.forEach(unit => {
          files.push({
            path: unit.path,
            contents: unit.contents,
            sourceMap: unit.sourceMap
          });
          packageSpaceModuleIds.add(unit.moduleId);
          if (typeof unit.defined === 'string') {
            packageSpaceModuleIds.add(unit.defined);
          } else if (Array.isArray(unit.defined)) {
            unit.defined.forEach(d => packageSpaceModuleIds.add(d));
          }
        });

        // reset to userSpaceUnits
        files.push({contents: 'define.switchToUserSpace();'});
      }

      if (!this._bundles[bundle]) this._bundles[bundle] = {};

      this._bundles[bundle].files = files;
      this._bundles[bundle].modules = {
        user: Array.from(userSpaceModuleIds).sort(),
        package: Array.from(packageSpaceModuleIds).sort()
      };

      if (bundle === this._entryBundle) {
        // write appends
        this._appends.forEach(f => files.push(f));
      }
    });

    const bundleWithConfig = this._bundles[this._entryBundle];
    if (!bundleWithConfig) {
      throw new Error(`Entry bundle "${this._entryBundle}" is missing`);
    }

    const bundlesConfig = (bundleWithConfig.config && bundleWithConfig.config.bundles) || {};

    Object.keys(this.dirty).forEach(bundle => {
      if (bundle !== this._entryBundle) {
        bundlesConfig[bundle] = this._bundles[bundle].modules;
      }
      delete this._bundles[bundle].modules;
    });

    bundleWithConfig.config = {
      baseUrl: this._baseUrl,
      // TODO paths:
      bundles: bundlesConfig
    };

    const bundles = {};
    Object.keys(this.dirty).forEach(bundle => {
      bundles[bundle] = this._bundles[bundle];
    });
    // reset dirty flags
    this.dirty = {[this._entryBundle]: true};

    return bundles;
  }
}

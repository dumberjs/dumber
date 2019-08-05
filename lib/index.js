const trace = require('./trace');
const {cleanPath, parse, mapId} = require('dumber-module-loader/dist/id-utils');
const defaultPackageFileReader = require('./package-file-reader/default');
const PackageReader = require('./package-reader');
const Package = require('./package');
const stubModule = require('./stub-module');
const {info, error, warn} = require('./log');
const {generateHash, stripJsExtension, resolvePackagePath, contentOrFile} = require('./shared');
const cache = require('./cache/default');
const path = require('path');
const ModulesDone = require('./modules-done');
const ModulesTodo = require('./modules-todo');

// Bundler does
// 1. capture: capture units (unit is a file like object plus meta data)
// 2. resolve: resolve all dependencies
// 3. bundle: write to bundles (objs, not final file contents)

// gulp-dumber or dumberify will then process bundles objects to files

module.exports = class Bundler {
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

    if (opts.hasOwnProperty('injectCss') && !opts.injectCss) {
      this._injectCss = false;
    } else {
      // by default turn on injection of css (inject onto html head)
      this._injectCss = true;
    }

    let _paths = {};
    if (opts.paths) {
      Object.keys(opts.paths).forEach(path => {
        let alias = opts.paths[path];
        _paths[cleanPath(path)] = cleanPath(alias);
      });
    }
    this._paths = _paths;

    this._unitsMap = {};

    this._modules_done = new ModulesDone();
    this._modules_todo = new ModulesTodo();

    this._readersMap = {};
    this._fileReader = opts.packageFileReader || defaultPackageFileReader;

    // baseUrl default to "dist"
    this._baseUrl = opts.baseUrl || '/dist';
    this._depsFinder = opts.depsFinder;
    this._onRequire = opts.onRequire || opts.onrequire || opts.onRequiringModule;

    this._prepends = (opts.prepends || opts.prepend || []).filter(t => t);

    if (!opts.skipModuleLoader) {
      this._prepends.push(
        // load dumber-module-loader after prepends
        path.join(path.relative(process.cwd(), _resolve('dumber-module-loader')), 'dist', 'index.debug.js')
      );
    }

    this._appends = (opts.appends || opts.append || []).filter(t => t);

    this._dependencies = (opts.dependencies || opts.deps || []).filter(t => t).map(d => new Package(d));
    this._entryBundle = stripJsExtension(opts.entryBundle) || 'entry-bundle';
    this._codeSplit = opts.codeSplit || function(){};
    // mark dirtiness of bundles
    this.dirty = {[this._entryBundle]: true};
    // persist bundles in watch mode
    this._bundles = {};
    this._inWatchMode = false;

    this._onAcquire = this._onAcquire.bind(this);
    this._supportInjectCssIfNeeded = this._supportInjectCssIfNeeded.bind(this);
    this._resolveExplicitDepsIfNeeded = this._resolveExplicitDepsIfNeeded.bind(this);
  }

  clearCache() {
    if(this._cache) return this._cache.clearCache();
    return Promise.resolve();
  }

  packageReaderFor(packageConfig) {
    if (this._readersMap.hasOwnProperty(packageConfig.name)) {
      return Promise.resolve(this._readersMap[packageConfig.name]);
    }

    return this._fileReader(packageConfig).then(fileReader => {
      const reader = new PackageReader(fileReader);
      this._readersMap[packageConfig.name] = reader;
      return reader.ensureMainPath();
    }).then(reader => {
      info(reader.banner());
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
    const hash = generateHash(JSON.stringify(unit));

    if (this._inWatchMode && !unit.packageName) {
      if (this._unitsMap[unit.path]) {
        const oldHash = this._unitsMap[unit.path].hash;

        if (oldHash === hash) {
          // ignore unchanged file in watch mode
          return Promise.resolve(this._unitsMap[unit.path]);
        }

        info(`Update ${unit.path}`);
      } else {
        info(`Add ${unit.path}`);
      }
    }

    if (unit.packageName) {
      unit.shim = this.shimFor(unit.packageName);
    }

    // return tracedUnit
    return this._trace(unit, {
      cache: this._cache,
      depsFinder: this._depsFinder
    }).then(
      tracedUnit => {
        tracedUnit.hash = hash;
        return this._capture(tracedUnit);
      },
      err => {
        // just print error, but not stopping
        error('Tracing failed for ' + unit.path);
        error(err);
      }
    );
  }

  _capture(tracedUnit) {
    let key = tracedUnit.path;
    if (tracedUnit.packageName) key = tracedUnit.packageName + ':' + key;
    this._unitsMap[key] = tracedUnit;

    // mark as done.
    this._modules_done.addUnit(tracedUnit);
    // process deps.
    this._modules_todo.process(tracedUnit);

    const bundle = this.bundleOf(tracedUnit);
    // mark related bundle dirty
    tracedUnit.bundle = bundle;
    this.dirty[bundle] = true;

    return tracedUnit;
  }

  _resolveExplicitDepsIfNeeded() {
    if (this._isExplicitDepsResolved) return Promise.resolve();
    this._isExplicitDepsResolved = true;

    let p = Promise.resolve();

    if (this._dependencies.length) info('Manually add dependencies:');

    this._dependencies.forEach(pkg => {
      p = p.then(() => this.packageReaderFor(pkg)).then(reader => {
        if (!pkg.lazyMain) {
          return reader.readMain()
          .then(unit => this.capture(unit));
        }
      });
    });

    return p.then(() => info('Auto trace dependencies:'));
  }

  _resolvePrependsAndAppends() {
    if (this._isPrependsAndAppendsResolved) return Promise.resolve();
    this._isPrependsAndAppendsResolved = true;

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

  _supportInjectCssIfNeeded() {
    if (!this._modules_todo.needCssInjection || !this._injectCss || this._isInjectCssTurnedOn) {
      return Promise.resolve();
    }
    this._isInjectCssTurnedOn = true;

    return this.capture({
      path:'__stub__/ext-css.js',
      contents: "define(['dumber/dist/inject-css'],function(m){return m;});",
      moduleId: 'ext:css',
      alias: ['ext:less', 'ext:scss', 'ext:sass', 'ext:styl']
    });
  }

  resolve() {
    return this._resolvePrependsAndAppends()
      .then(this._resolveExplicitDepsIfNeeded)
      .then(() => this._modules_todo.acquire(this._onAcquire))
      .then(this._supportInjectCssIfNeeded)
      .then(() => {
        // recursively resolve
        if (this._modules_todo.hasTodo()) {
          return this.resolve();
        }
      });
  }

  // trace missing dep
  _onAcquire(id, opts) {
    const checkUserSpace = opts.user;
    const checkPackageSpace = opts.package;
    const requiredBy = opts.requiredBy;
    const parsedId = parse(mapId(id, this._paths));

    if (this._modules_done.has(parsedId.bareId, checkUserSpace, checkPackageSpace)) {
      return Promise.resolve();
    }

    // TODO add a callback point to fillup missing local dep.
    // This is needed by dumberify.
    if (checkUserSpace && !checkPackageSpace) {
      // detected missing local dep
      warn(`local dependency ${parsedId.bareId} (requiredBy ${requiredBy.join(', ')}) is missing`);
      return Promise.resolve();
    }

    return new Promise(resolve => {
      resolve(this._onRequire && this._onRequire(parsedId.bareId, parsedId));
    }).then(
      result => {
        // ignore this module id
        if (result === false) return true;

        // require other module ids instead
        if (Array.isArray(result) && result.length) {
          this._modules_todo.process({
            moduleId: parsedId.bareId,
            packageName: (!checkUserSpace && checkPackageSpace) ? parsedId.parts[0] : undefined,
            deps: result
          });
          return true;
        }

        // got full content of this module
        if (typeof result === 'string') {
          return this.capture({
            path: '__on_require__/' + parsedId.bareId + (parsedId.ext ? '' : '.js'),
            contents: result,
            moduleId: parsedId.bareId,
            packageName: parsedId.parts[0]
          }).then(() => true);
        }

        // process normally if result is not recognizable
      },
      // proceed normally after error
      err => {
        error('onRequire call failed for ' + parsedId.bareId);
        error(err);
      }
    ).then(didRequire => {
      if (didRequire === true) return;

      const bareId = parsedId.bareId;
      const packageName = parsedId.parts[0];
      const resource = bareId.slice(packageName.length + 1);

      const stub = stubModule(bareId);
      if (stub) info('Stub module ' + bareId);

      if (typeof stub === 'string') {
        return this.capture({
          // not a real file path
          path:'__stub__/' + bareId + '.js',
          contents: stub,
          moduleId: bareId,
          packageName
        });
      }

      return this.packageReaderFor(stub || {name: packageName})
        .then(reader => resource ? reader.readResource(resource) : reader.readMain())
        .then(unit => this.capture(unit))
        .catch(err => {
          error('Resolving failed for module ' + bareId);
          error(err);
        });
    });
  }

  _unitsForBundle(bundle) {
    let units = [];

    Object.keys(this._unitsMap).forEach(key => {
      const unit = this._unitsMap[key];
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

    // Special treatment for jquery and moment, put them in front of everything else,
    // so that jquery and moment can create global vars as early as possible.
    // This improves compatibility with some legacy jquery plugins.
    // Note as of momentjs version 2.10.0, momentjs no longer exports global object
    // in AMD module environment. There is special code in src/trace.js
    // to bring up global var "moment".
    const special = [];
    while (true) { // eslint-disable-line no-constant-condition
      const idx = sorted.findIndex(unit =>
        unit.packageName === 'jquery' || unit.packageName === 'moment'
      );

      if (idx === -1) break;
      special.push(...sorted.splice(idx, 1));
    }

    return [...special, ...sorted];
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
          unit.defined.forEach(d => userSpaceModuleIds.add(d));
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
          unit.defined.forEach(d => packageSpaceModuleIds.add(d));
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

      if (bundle === this._entryBundle && this._appends.length) {
        let appendFiles = [];
        // write appends
        this._appends.forEach(f => appendFiles.push(f));
        this._bundles[bundle].appendFiles = appendFiles;
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
      paths: JSON.parse(JSON.stringify(this._paths)),
      bundles: bundlesConfig
    };

    const bundles = {};
    Object.keys(this.dirty).forEach(bundle => {
      bundles[bundle] = this._bundles[bundle];
    });
    // reset dirty flags
    this.dirty = {[this._entryBundle]: true};

    // turn on watch node after first "bundle()"
    this._inWatchMode = true;
    return bundles;
  }
};

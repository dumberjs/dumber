import Bundle from './bundle';
import trace from './trace';
import {parse, ext} from './id-utils';
import alias from './transformers/alias';
import defaultPackageLocator from './package-locators/default';
import PackageReader from './package-reader';

function mergeTransformed(unit, transformed) {
  if (transformed.defined) {
    let newDefined = transformed.defined
    if (!Array.isArray(newDefined)) newDefined = [newDefined];

    if (!unit.defined) {
      unit.defined = []
    } else if (typeof unit.defined === 'string') {
      unit.defined = [unit.defined];
    }
    unit.defined.push.apply(unit.defined, newDefined);
  }

  if (transformed.contents) {
    unit.contents += transformed.contents;
  }
}

// Tracer does
// 1. capture: capture units (file like obj plus meta data)
// 2. resolve: resolve all dependencies
// 3. bundle: write to bundles units (file like obj plus meta data)
// gulp will then pick bundles files to do uglify and dest write.

export class Tracer {
  constructor(opts, mock) {
    opts = opts || {};
    // decoupling for testing
    this.trace = (mock && mock.trace) || trace;
    const _Bundle = (mock && mock.Bundle) || Bundle;

    this._capture = this._capture.bind(this);

    this.filesMap = {};
    this.moduleIdDone = new Set();
    this.moduleIdTodo = new Set();
    this.packageReadersMap = {};
    this.packageLocator = opts.packageLocator || defaultPackageLocator;

    // optional
    this.src = opts.src || 'src';
    this.depsFinder = opts.depsFinder;
    this.onMissingNpmPackage = opts.onMissingNpmPackage;

    const bundles = opts.bundles || [{ name: 'app' }];

    if (!Array.isArray(bundles) || !bundles.length) {
      throw new Error('bundles definition is invalid');
    }

    this.bundles = bundles.map(cfg =>  new _Bundle(cfg));
    this.entryBundle = this.bundles[this.bundles.length - 1];
    // always load requirejs and requirejs/text plugin
    this.entryBundle.prepends.push('node_modules/requirejs/require.js');
    this.entryBundle.dependencies.unshift('text');
  }

  packageReaderFor(packageConfig) {
    if (this.packageReadersMap.hasOwnProperty(packageConfig.name)) {
      return Promise.resolve(this.packageReadersMap[packageConfig.name]);
    }

    return this.packageLocator(packageConfig).then(locator => {
      const reader = new PackageReader(locator);
      this.packageReadersMap[packageConfig.name] = reader;
      return reader;
    });
  }

  shimFor(packageName) {
    const bLen = this.bundles.length;

    for (let b = 0; b < bLen; b += 1) {
      const dependencies = this.bundles[b].dependencies;
      const len = dependencies.length;

      for (let i = 0; i < len; i += 1) {
        const pkg = dependencies[i];

        if (pkg.name === packageName) {
          return pkg.shim;
        }
      }
    }
  }

  bundleOf(unit) {
    return this.bundles.find(b => b.match(unit)) || this.entryBundle;
  }

  unitOfModuleId(moduleId) {
    if (!this.moduleIdDone.has(moduleId)) return;

    const paths = Object.keys(this.filesMap);
    const pLen = paths.length;

    for (let i = 0; i < pLen; i += 1) {
      const unit = this.filesMap[paths[i]];
      if (unit.moduleId === moduleId ||
          (unit.defined && unit.defined.indexOf(moduleId) !== -1)) {
        return unit;
      }
    }
  }

  capture(unit) {
    if (unit.packageName) {
      unit.shim = this.shimFor(unit.packageName);
    }

    // return tracedUnit;
    return this.trace(unit).then(
      this._capture,
      err => console.error(err)
    );
  }

  _addToDone(id) {
    if (typeof id === 'string') {
      this.moduleIdDone.add(id);
    } else if (Array.isArray(id)) {
      id.forEach(d => this.moduleIdDone.add(d));
    }
  }

  _capture(tracedUnit) {
    this.filesMap[tracedUnit.path] = tracedUnit;

    // mark as done.
    this._addToDone(tracedUnit.moduleId);
    this._addToDone(tracedUnit.defined);

    // mark todo. beware we didn't check whether the id is in moduleIdDone.
    // they will be checked during resolve phase.
    tracedUnit.deps.forEach(d => this.moduleIdTodo.add(d));

    const bundle = this.bundleOf(tracedUnit);
    // mark related bundle dirty
    bundle.dirty = true;

    return tracedUnit;
  }

  _resolveExplicitDepsIfNeeded() {
    if (this.isExplicitDepsResolved) return Promise.resolve();

    const bLen = this.bundles.length;
    let works = [];

    for (let b = 0; b < bLen; b += 1) {
      const dependencies = this.bundles[b].dependencies;
      const len = dependencies.length;

      for (let i = 0; i < len; i += 1) {
        const pkg = dependencies[i];
        works.push(this.packageReaderFor(pkg).then(reader => {
          // TODO
          return reader;
        }));
      }
    }
  }

  // TODO loop resolve to resolve all
  resolve() {
    this._resolveExplicitDepsIfNeeded();

    let todo = [];

    this.moduleIdTodo.forEach(id => {
      const parsedId = parse(id);

      if (this.moduleIdDone.has(parsedId.bareId)) return;

      // for foo/bar, nodejs will search foo/bar/index
      if (!ext(id) && !parsedId.bareId.endsWith('index')) {
        const possible = parsedId.bareId + '/index';

        if (this.moduleIdDone.has(possible)) {
          // ok you have a alias
          let unit = this.unitOfModuleId(possible);
          if (!unit) throw new Error('missing unit for moduleId: "' + possible + '"');

          let aliasResult = alias(parsedId.bareId, possible);
          mergeTransformed(unit, aliasResult);

          // aliasResult.defined for js is surely a single string
          this._addToDone(aliasResult.defined);
        }
      }

      todo.push(parsedId);
    });

    // clear after screened all to todo list
    this.moduleIdTodo.clear();
    todo.sort();

    let p = Promise.resolve();

    const len = todo.length;
    for (let i = 0; i < len; i += 1) {
      const bareId = todo[i].bareId;
      const packageName = todo[i].parts[0];
      const resource = bareId.substr(packageName.length + 1);

      p = p.then(() => this.packageReaderFor({name: packageName}))
      .then(reader => resource ? reader.readResource(resource) : reader.readMain())
      .then(unit => this.capture(unit))
      .then(tracedUnit => {
        if (this.moduleIdDone.has(bareId)) return;

        const defined = tracedUnit.defined;
        let toId;
        if (Array.isArray(defined)) {
          toId = defined[0];
        } else if (typeof defined === 'string') {
          toId = defined;
        }

        // alias to main is also created here
        if (!toId) return new Error('no defined module found in ' + tracedUnit.path);
        let aliasResult = alias(bareId, toId);
        mergeTransformed(tracedUnit, aliasResult);
        this._addToDone(aliasResult.defined);
      })
      .catch(err => {
        console.error(err);
      });
    }

    return p;
  }

  bundle() {
    // for all dirty bundle
    // sort units based on moduleId and shim deps
    // concat-with-source-maps?
    // prepends file
  }
}

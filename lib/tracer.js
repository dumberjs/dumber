'use strict';
const Bundle = require('./bundle');
const trace = require('./trace');
const idUtils = require('./id-utils');
const alias = require('./transformers/alias');
const defaultPackageLocator = require('./package-locators/default');
const PackageReader = require('./package-reader');

// Tracer does
// 1. capture: capture units (file like obj plus meta data)
// 2. resolve: resolve all dependencies
// 3. bundle: write to bundles units (file like obj plus meta data)
// gulp will then pick bundles files to do uglify and dest write.

function Tracer (opts, mock) {
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

  this.bundles = bundles.map(function (cfg) { return new _Bundle(cfg); });
  this.entryBundle = this.bundles[this.bundles.length - 1];
  // always load requirejs and requirejs/text plugin
  this.entryBundle.prepends.push('node_modules/requirejs/require.js');
  this.entryBundle.dependencies.unshift('text');
}

Tracer.prototype.packageReaderFor = function (packageName) {
  if (this.packageReadersMap.hasOwnProperty(packageName)) {
    return Promise.resolve(this.packageReadersMap[packageName]);
  }

  return this.packageLocator(packageName).then(function (locator) {
    const reader = new PackageReader(locator);
    this.packageReadersMap[packageName] = reader;
    return reader;
  });
};

Tracer.prototype.shimFor = function (packageName) {
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
};

Tracer.prototype.bundleOf = function (unit) {
  const bLen = this.bundles.length;

  for (let b = 0; b < bLen; b += 1) {
    const bundle = this.bundles[b];
    // always match the last entryBundle
    if (b === bLen - 1 || bundle.match(unit)) return bundle;
  }
};

Tracer.prototype.unitOfModuleId = function (moduleId) {
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
};

Tracer.prototype.capture = function (unit) {
  if (unit.packageName) {
    unit.shim = this.shimFor(unit.packageName);
  }

  // return tracedUnit;
  return this.trace(unit).then(
    this._capture,
    function(err) {
      console.error(err);
    }
  );
};

Tracer.prototype._addToDone = function (id) {
  let self = this;

  if (typeof id === 'string') {
    self.moduleIdDone.add(id);
  } else if (Array.isArray(id)) {
    id.forEach(function (d) { self.moduleIdDone.add(d); });
  }
};

Tracer.prototype._capture = function (tracedUnit) {
  let self = this;
  this.filesMap[tracedUnit.path] = tracedUnit;

  // mark as done.
  this._addToDone(tracedUnit.moduleId);
  self._addToDone(tracedUnit.defined);

  // mark todo. beware we didn't check whether the id is in moduleIdDone.
  // they will be checked during resolve phase.
  tracedUnit.deps.forEach(function (d) { self.moduleIdTodo.add(d); });

  const bundle = this.bundleOf(tracedUnit);
  // mark related bundle dirty
  bundle.dirty = true;

  return tracedUnit;
};

// TODO before resolve first time run, resolve all explicit dependencies first
// TODO loop resolve to resolve all
Tracer.prototype.resolve = function () {
  let self = this;
  let todo = [];

  this.moduleIdTodo.forEach(function (id) {
    const parsedId = idUtils.parse(id);

    if (self.moduleIdDone.has(parsedId.bareId)) return;

    // for foo/bar, nodejs will search foo/bar/index
    if (!idUtils.ext(id) && !parsedId.bareId.endsWith('index')) {
      const possible = parsedId.bareId + '/index';

      if (self.moduleIdDone.has(possible)) {
        // ok you have a alias
        let unit = self.unitOfModuleId(possible);
        if (!unit) throw new Error('missing unit for moduleId: "' + possible + '"');

        let aliasResult = alias(parsedId.bareId, possible);
        mergeTransformed(unit, aliasResult);

        // aliasResult.defined for js is surely a single string
        self._addToDone(aliasResult.defined);
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

    p = p.then(function () {
      return self.packageReaderFor(packageName);
    }).then(function (reader) {
      if (resource) {
        return reader.readMain();
      } else {
        return reader.readResource(resource);
      }
    }).then(function (unit) {
      return self.capture(unit);
    }).then(function (tracedUnit) {
      if (self.moduleIdDone.has(bareId)) return;

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
      self._addToDone(aliasResult.defined);
    })
    .catch(err => {
      console.error(err);
    });
  }

  return p;
};

Tracer.prototype.bundle = function () {
  // for all dirty bundle
  // sort units based on moduleId and shim deps
  // concat-with-source-maps?
  // prepends file
};

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

module.exports = Tracer;

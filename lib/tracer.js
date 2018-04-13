'use strict';
const Bundle = require('./bundle');
const trace = require('./trace');
const idUtils = require('./id-utils');
const alias = require('./transformers/alias');

// Tracer does
// 1. capture: capture units (file like obj plus meta data)
// 2. resolve: resolve all dependencies
// 3. bundle: write to bundles units (file like obj plus meta data)
// gulp will then pick bundles files to do uglify and dest write.

function Tracer (opts, mock) {
  // decoupling for testing
  this.trace = (mock && mock.trace) || trace;
  const _Bundle = (mock && mock.Bundle) || Bundle;

  this.filesMap = {};
  this.moduleIdDone = new Set();
  this.moduleIdTodo = new Set();

  // mandatory
  if (!opts || !opts.npmPackageLocator) {
    throw new Error('npm package locator is not provided');
  }
  this.npmPackageLocator = opts.npmPackageLocator;

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
}

Tracer.prototype.shimFor = function (packageName) {
  const bLen = this.bundles.length;

  for (let b = 0; b < bLen; b += 1) {
    const dependencies = this.bundles[b].dependencies;
    const len = dependencies.length;

    for (let i = 0; i < len; i += 1) {
      const pkg = dependencies[i];

      if (pkg.name === packageName) {
        if (pkg.deps || pkg.exports) {
          return {
            deps: pkg.deps,
            'exports': pkg.exports,
            wrapShim: !!pkg.wrapShim
          };
        }
        return;
      }
    }
  }
};

Tracer.prototype.bundleOf = function (unit) {
  const bLen = this.bundles.length;

  for (let b = 0; b < bLen; b += 1) {
    const bundle = this.bundles[b];
    // also match the last entryBundle
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
  let self = this;

  if (unit.packageName) {
    unit.shim = this.shimFor(unit.packageName);
  }

  const tracedUnit = this.trace(unit);
  this.filesMap[tracedUnit.path] = tracedUnit;

  // mark as done.
  this.moduleIdDone.add(tracedUnit.moduleId);

  if (typeof tracedUnit.defined === 'string') {
    this.moduleIdDone.add(tracedUnit.defined);
  } else if (Array.isArray(tracedUnit.defined)) {
    tracedUnit.defined.forEach(function (d) { self.moduleIdDone.add(d); });
  }

  // mark todo. beware we didn't check whether the id is in moduleIdDone.
  // they will be checked during resolve phase.
  tracedUnit.deps.forEach(function (d) { self.moduleIdTodo.add(d); });

  const bundle = this.bundleOf(unit);
  // mark related bundle dirty
  bundle.dirty = true;
}

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
        self.moduleIdDone.add(aliasResult.defined);
      }
    }

    todo.push(parsedId.bareId);
  });

  // clear after screened all to todo list
  this.moduleIdTodo.clear();
  todo.sort();

};

Tracer.prototype.bundle = function () {
  // for all dirty bundle
  // sort units based on moduleId and shim deps
  // concat-with-source-maps?
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

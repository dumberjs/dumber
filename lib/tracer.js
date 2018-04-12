'use strict';
const cjs = require('./transformers/cjs');
const defines = require('./transformers/defines');
const resolveModuleId = require('./resolve-module-id');

function Tracer (opts) {
  this.moduleIdDone = new Set();
  this.moduleIdToDo = new Set();

  // mandatory
  if (!opts || !opts.npmPackageLocator) {
    throw new Error('npm package locator is not provided');
  }
  this.npmPackageLocator = opts.npmPackageLocator;

  // optional
  this.dependencies = opts.dependencies || [];
  this.depsFinder = opts.depsFinder;
  this.onMissingNpmPackage = opts.onMissingNpmPackage;
}

Tracer.prototype.shimFor = function (packageName) {
  const len = this.dependencies.length;
  for (let i = 0; i < len; i += 1) {
    const pkg = this.dependencies[i];
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
};

Tracer.prototype.capture = function (unit) {
  const filepath = unit.path;
  const contents = unit.contents;
  // TODO
  // const sourceMap = unit.sourceMap;
  const moduleId = unit.moduleId;
  const packageName = unit.packageName;

  if (packageName && !moduleId.startsWith(packageName + '/')) {
    throw new Error('module "' + moduleId + '" is not in package "' + packageName + '"');
  }

  const forceCjsWrap = !!filepath.match(/\/(cjs|commonjs)\//i);
  let cjsResult = cjs(contents, forceCjsWrap);
  let defResult = defines(moduleId, cjsResult.contents, this.shimFor(packageName));

  let headLines = (cjsResult.headLines || 0) + (cjsResult.headLines || defResult.headLines);
  if (headLines) {
    // TODO adjust sourceMap
  }

  let deps = new Set(defResult.deps || []);
  // TODO deal with defResult defined

  // customised deps finder
  if (defResult.defined && this.depsFinder) {
    let newDeps = this.depsFinder(filepath, defResult.contents);
    if (newDeps && newDeps.length) {
      newDeps.forEach(function (d) { deps.add(d); });
    }
  }

  let moduleIdToDo = this.moduleIdToDo;
  deps.forEach(function (d) {
    moduleIdToDo.add(resolveModuleId(moduleId, d));
  });

  return {
    contents: defResult.contents,
    // sourceMap: sourceMap
  };

  // TODO need to capture all moduleIds from gulp first,
  // then start trace.
}


module.exports = Tracer;

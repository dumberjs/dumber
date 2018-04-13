'use strict';
const Bundle = require('./bundle');

function Tracer (opts) {
  this.moduleIdDone = new Set();
  this.moduleIdToDo = new Set();

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

  this.bundles = bundles.map(function (cfg) { return new Bundle(cfg); });
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

Tracer.prototype.capture = function (unit) {

  // TODO need to capture all moduleIds from gulp first,
  // then start trace.
}


module.exports = Tracer;

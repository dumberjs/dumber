'use strict';
// npm package dependency

function Package(opts) {
  if (!opts) {
    throw new Error('missing package options, use "packageName" or {name: "packageName", ...}');
  }

  if (typeof opts === 'string') {
    this.name = opts;
  } else {
    this.name = opts.name;
  }

  if (!this.name) {
    throw new Error('not a valid package options, use "packageName" or {name: "packageName", ...}');
  }

  this.resources = Array.isArray(opts.resources) ? opts.resources : [];
  this.deps = Array.isArray(opts.deps) ? opts.deps : undefined;
  this.exports = (typeof opts.exports === 'string') ? opts.exports : undefined;
  this.wrapShim = !!opts.wrapShim;
  this.lazyMain = !!opts.lazyMain;
}

module.exports = Package;

'use strict';
const Minimatch = require("minimatch").Minimatch;
const Package = require('./package');

function isRegExp(obj) {
  return typeof obj === 'object' &&
    Object.prototype.toString.call(obj) === '[object RegExp]';
}

function nope () {}

function anyMatch(matchers) {
  return function (path, moduleId, packageName) {
    const len = matchers.length;
    for (let i = 0; i < len; i += 1) {
      if (matchers[i](path, moduleId, packageName)) return true;
    }
    return false;
  }
}

function buildMatch(patterns) {
  if (!patterns) return nope;
  if (!Array.isArray(patterns)) patterns = [patterns];
  if (!patterns.length) return nope;

  const matchers = patterns.map(function (pattern) {
    if (typeof pattern === 'function') return pattern;
    if (isRegExp(pattern)) return function (path) { return pattern.test(path); };
    if (typeof pattern === 'string') {
      const mm = new Minimatch(pattern);
      return function (path) { return mm.match(path); };
    }

    throw new Error('unsupported pattern, not string/regex/func : ' + pattern);
  });

  return anyMatch(matchers);
}

function Bundle (opts, mock) {
  // decoupling for testing
  const _Package = (mock && mock.Package) || Package;

  if (!opts || !opts.name) {
    throw new Error('not a valid bundle options, use {name: "a_name"}');
  }

  this.name = opts.name;
  this._match = buildMatch(opts.contain);
  this.prepends = Array.isArray(opts.prepends) ? opts.prepends : [];

  if (Array.isArray(opts.dependencies)) {
    this.dependencies = opts.dependencies.map(function(opts) {
      return new _Package(opts);
    });
  } else {
    this.dependencies = [];
  }
}

Bundle.prototype.match = function (unit) {
  const path = unit.path;
  const moduleId = unit.moduleId;
  const packageName = unit.packageName;

  // if in dependencies list
  const dLen = this.dependencies.length;
  for (let d = 0; d < dLen; d += 1) {
    if (this.dependencies[d].name === packageName) return true;
  }

  // if matches patterns
  return this._match(path, moduleId, packageName);
};

module.exports = Bundle;

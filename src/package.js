// npm package dependency
export default class Package {
  constructor(opts) {
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

    this.location = (typeof opts.location === 'string') ? opts.location : undefined;
    this.main = (typeof opts.main === 'string') ? opts.main : undefined;
    this.version = (typeof opts.version === 'string') ? opts.version : undefined;
    this.lazyMain = !!opts.lazyMain;

    const deps = Array.isArray(opts.deps) ? opts.deps : undefined;
    const _exports = (typeof opts.exports === 'string') ? opts.exports : undefined;
    const wrapShim = !!opts.wrapShim;

    if (deps || _exports) {
      this.shim = {
        deps: deps,
        'exports': _exports,
        wrapShim: wrapShim
      };
    }
  }
}

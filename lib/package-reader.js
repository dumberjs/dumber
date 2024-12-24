const {ext, parse, nodejsIds, resolveModuleId, relativeModuleId} = require('dumber-module-loader/dist/id-utils');
const {stripSourceMappingUrl, getSourceMap} = require('./shared');
const {info, error} = require('./log');
const path = require('path');

module.exports = class PackageReader {
  constructor(fileReader, needsSourceMap = true) {
    this.fileReader = fileReader;
    this.needsSourceMap = needsSourceMap;
    this._readFile = this._readFile.bind(this);
  }

  banner() {
    const {version, name} = this;
    const config = this.fileReader.packageConfig;

    let info = [];
    if (config.location) {
      const location = path.relative(process.cwd(), config.location);
      info.push('location: ' + location);
    }
    if (config.main) {
      info.push('main: ' + config.main);
    }
    let result = `${version.padEnd(10)} ${name}`;
    if (info.length) result += ` { ${info.join(', ')} }`;
    return result;
  }

  ensureMainPath() {
    if (this.hasOwnProperty('mainPath')) return Promise.resolve();

    return this.fileReader('package.json')
      .then(file => {
        let metadata = JSON.parse(file.contents);
        this.name = metadata.name;
        this.version = metadata.version || 'N/A';
        this.browserReplacement = _browserReplacement(metadata.browser);
        this.exportsReplacement = _exportsReplacement(metadata.exports);

        return this._main(metadata)
          // fallback to "index.js" even when it's missing.
          // packageReader can still read other resource when main is missing.
          .catch(() => {
            // don't fallback when forced main is failed.
            if (!metadata.dumberForcedMain) {
              return 'index.js';
            }
          });
      })
      .then(mainPath => {
        const replacement = this.browserReplacement['./' + mainPath];
        if (replacement) {
           // replacement is always local, remove leading ./
          mainPath = replacement.slice(2);
        }

        this.mainPath = mainPath;
        this.parsedMainId = parse(mainPath);
        return this;
      });
  }

  readMain() {
    return this.ensureMainPath()
      .then(() => this._readFile(this.mainPath));
  }

  readResource(resource, isLocalRequire = false) {
    return this.ensureMainPath().then(() => {
      let parts = this.parsedMainId.parts;
      let len = parts.length;
      let i = 0;

      const findResource = () => {
        if (i >= len) {
          return Promise.reject(new Error(`could not find "${resource}" in package ${this.name}`));
        }

        let resParts = parts.slice(0, i);
        resParts.push(resource);

        let fullResource = resParts.join('/');

        let replacement;

        // exports subpath is designed for outside require.
        if (!isLocalRequire) {
          if (('./' + fullResource) in this.exportsReplacement) {
            replacement = this.exportsReplacement['./' + fullResource];
          } else if (('./' + fullResource + '.js') in this.exportsReplacement) {
            replacement = this.exportsReplacement['./' + fullResource + '.js'];
          }

          if (replacement === null) {
            throw new Error(`Resource ${this.name + '/' + resource} is not allowed to be imported (${this.name} package.json exports definition ${JSON.stringify(this.exportsReplacement)}).`);
          }

          if (!replacement) {
            // Try wildcard replacement
            for (const key in this.exportsReplacement) {
              const starIndex = key.indexOf('*');
              if (starIndex !== -1) {
                const prefix = key.slice(2, starIndex); // remove ./
                const subfix = key.slice(starIndex + 1);
                if (fullResource.startsWith(prefix) && fullResource.endsWith(subfix)) {

                  const target = this.exportsReplacement[key];
                  if (target && target.includes('*')) {
                    const flexPart = fullResource.slice(prefix.length, fullResource.length - subfix.length);
                    replacement = target.replace('*', flexPart);
                  } else {
                    replacement = target;
                  }
                  break;
                }
              }
            }
          }
        }

        if (!replacement) {
          replacement = this.browserReplacement['./' + fullResource] ||
          this.browserReplacement['./' + fullResource + '.js'];
        }

        if (replacement) {
           // replacement is always local, remove leading ./
          fullResource = replacement.slice(2);
        }

        return this._nodejsLoad(fullResource).then(
          filePath => this._readFile(filePath),
          () => {
            i += 1;
            return findResource();
          }
        );
      }

      return findResource();
    }).then(unit => {
      const requested = this.name + '/' + resource;

      if (nodejsIds(requested).indexOf(unit.moduleId) === -1) {
        // The requested id could be different from real id.
        // for example, some browser replacement.
        // e.g. readable-stream/readable -> readable-stream/readable-browser
        if (unit.alias) {
          unit.alias = [unit.alias, requested];
        } else {
          unit.alias = requested;
        }
      }
      return unit;
    });
  }

  // readFile contents, cleanup dep, normalise browser replacement
  _readFile(filePath) {
    if (!this._logged) {
      this._logged = true;
      info(this.banner());
    }

    return this.fileReader(filePath).then(file => {
      // Bypass traced cache
      if (file.defined) return file;

      const moduleId = this.name + '/' + parse(filePath).bareId;

      let replacement;
      if (normalizeExt(filePath) === '.js') {
        Object.keys(this.browserReplacement).forEach(key => {
          const target = this.browserReplacement[key];
          const baseId = this.name + '/index';
          const sourceModule = key.startsWith('.') ?
            relativeModuleId(moduleId, resolveModuleId(baseId, key)) :
            key;

          let targetModule;
          if (target) {
            targetModule = relativeModuleId(moduleId, resolveModuleId(baseId, target));
          } else {
            // {"module-a": false}
            // replace with special placeholder __ignore__
            targetModule = '__ignore__';
          }

          if (!replacement) replacement = {};
          replacement[sourceModule] = targetModule;
        });
      }

      const unit = {
        path: file.path.replace(/\\/g, '/'),
        contents: stripSourceMappingUrl(file.contents),
        moduleId,
        packageName: this.name,
        packageMainPath: this.mainPath,
        sourceMap: this.needsSourceMap ? getSourceMap(file.contents, file.path) : null
      };

      // the replacement will be picked up by transformers/replace.js
      if (replacement) unit.replacement = replacement;

      if (unit.moduleId === this.name + '/' + this.parsedMainId.bareId) {
        // add alias from package name to main file module id.
        // but don't add alias from "foo" to "foo/main.css".
        const mExt = normalizeExt(unit.path);
        const pExt = normalizeExt(this.name);
        if (mExt === pExt || (mExt === '.js' && !pExt)) {
          unit.alias = this.name;
        }
      }

      return unit;
    });
  }

  _whenFileExists(p) {
    return this.fileReader.exists(p)
      .then(exists => {
        if (!exists) throw new Error('File does not exist: ' + p);
      });
  }

  // https://nodejs.org/dist/latest-v10.x/docs/api/modules.html
  // after "high-level algorithm in pseudocode of what require.resolve() does"
  _nodejsLoadAsFile(filePath) {
    return this._whenFileExists(filePath).then(
      () => filePath,
      () => {
        const jsFilePath = filePath + '.js';
        return this._whenFileExists(jsFilePath).then(
          () => jsFilePath,
          () => {
            const jsonFilePath = filePath + '.json';
            return this._whenFileExists(jsonFilePath).then(
              () => jsonFilePath
            );
          }
        );
      }
    ).then(
      p => p.replace(/\\/g, '/'), // normalize path
      () => {
      throw new Error(`cannot load Nodejs file for ${filePath}`)
      }
    );
  }

  _nodejsLoadIndex(dirPath) {
    const indexJsFilePath = path.join(dirPath, 'index.js');
    return this._whenFileExists(indexJsFilePath).then(
      () => indexJsFilePath,
      () => {
        const indexJsonFilePath = path.join(dirPath, 'index.json');
        return this._whenFileExists(indexJsonFilePath).then(
          () => indexJsonFilePath
        );
      }
    ).then(
      p => p.replace(/\\/g, '/'), // normalize path
      () => {
        throw new Error(`cannot load Nodejs index file for ${dirPath}`)
      }
    );
  }

  _nodejsLoadAsDirectory(dirPath) {
    const packageJsonPath = path.join(dirPath, 'package.json');
    return this.fileReader(packageJsonPath).then(
      file => {
        let metadata;
        try {
          metadata = JSON.parse(file.contents);
        } catch (err) {
          error('Failed to parse ' + packageJsonPath);
          error(err);
          throw err;
        }

        return this._main(metadata, dirPath);
      },
      () => this._nodejsLoadIndex(dirPath)
    ).catch(() => {
      throw new Error(`cannot load Nodejs directory for ${dirPath}`)
    });
  }

  _nodejsLoad(filePath) {
    return this._nodejsLoadAsFile(filePath)
      .catch(() => this._nodejsLoadAsDirectory(filePath));
  }

  _main(metadata, dirPath = '') {
    // try 1. exports > 2.browser > 3.module > 4.main
    // the order is to target browser.
    // note path.join also cleans up leading './'.
    const mains = [];
    if (typeof metadata.dumberForcedMain === 'string') {
      // dumberForcedMain is not in package.json.
      // it is the forced main override in dumber config,
      // set by package-file-reader/default.js and
      // package-file-reader/jsdelivr.js.
      // note there is no fallback to other browser/module/main fields.
      mains.push({field: 'dumberForcedMain', path: path.join(dirPath, metadata.dumberForcedMain)});
    } else {

      const exportsMain = _exportsMain(metadata.exports);
      if (typeof exportsMain === 'string') {
        mains.push({field: 'exports', path: path.join(dirPath, exportsMain)});
      }

      if (typeof metadata.browser === 'string')  {
        // use package.json browser field if possible.
        mains.push({field: 'browser', path: path.join(dirPath, metadata.browser)});
      } else if (typeof metadata.browser === 'object' &&
        typeof metadata.browser['.'] === 'string')  {
        // use package.json browser mapping {".": "dist/index.js"} if possible.
        mains.push({field: 'browser', path: path.join(dirPath, metadata.browser['.'])});
      }

      if (typeof metadata.module === 'string' &&
        !(metadata.name && metadata.name.startsWith('aurelia-'))) {
        // prefer es module format over cjs, just like webpack.
        // this improves compatibility with TypeScript.
        // ignores aurelia-* core npm packages as some module
        // field might still point to es2015 folder.
        mains.push({field: 'module', path: path.join(dirPath, metadata.module)});
      }

      if (typeof metadata.main === 'string') {
        mains.push({field: 'main', path: path.join(dirPath, metadata.main)});
      }

      // The last fallback is "index".
      if (!mains.find(e => e.path === 'index')) {
        mains.push({field: 'fallback', path: path.join(dirPath, 'index')});
      }
    }

    let p = Promise.reject();
    for (let main of mains) {
      // Only try next main field when previous one failed.
      p = p.catch(() => this._nodejsLoadAsFile(main.path))
      .catch(() => this._nodejsLoadIndex(main.path));
    }
    p = p.catch(() => {
      throw new Error('cannot load main resource from any possible locations:\n' + JSON.stringify(mains, null, 2));
    })
    return p;
  }
};

// https://github.com/defunctzombie/package-browser-field-spec
function _browserReplacement(browser) {
  // string browser field is alternative main
  if (!browser || typeof browser === 'string') return {};

  let replacement = {};

  Object.keys(browser).forEach(key => {
    // leave {".": "dist/index.js"} to the main field replacment
    if (key === '.') return;
    const target = browser[key];

    let sourceModule = filePathToModuleId(key);

    if (typeof target === 'string') {
      let targetModule = filePathToModuleId(target);
      if (!targetModule.startsWith('.')) {
        // replacement is always local
        targetModule = './' + targetModule;
      }
      // Only replace when sourceModule cannot be resolved to targetModule.
      if (!nodejsIds(sourceModule).includes(targetModule)) {
        replacement[sourceModule] = targetModule;
      }
    } else {
      replacement[sourceModule] = false;
    }
  });

  return replacement;
}

function isExportsConditions(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  const keys = Object.keys(obj);
  return keys.length > 0 && keys[0][0] !== '.';
}

function pickCondition(obj) {
  // string or null
  if (typeof obj !== 'object' || obj === null) return obj;
  let env = process.env.NODE_ENV || '';
  if (env === 'undefined') env = '';

  if (Array.isArray(obj)) {
    for (const a of obj) {
      const result = pickCondition(a);
      if (result) return result;
    }
  }

  // use env (NODE_ENV) to support "development" and "production"
  for (const condition of ['import', 'module', 'browser', 'require', env, 'default']) {
    // Recursive call to support nested conditions.
    if (condition && condition in obj) return pickCondition(obj[condition]);
  }

  throw new Error("Unexpected exports condition: " + JSON.stringify(obj));
}

function _exportsMain(exports) {
  // string exports field is alternative main
  if (!exports || typeof exports === 'string') return exports;

  if (isExportsConditions(exports)) {
    return pickCondition(exports);
  }

  if (typeof exports === 'object') {
    for (const key in exports) {
      if (key === '.' || key !== './') {
        return pickCondition(exports[key]);
      }
    }
  }
}

function _exportsReplacement(exports) {
  // string exports field is alternative main,
  // leave to the main field replacment
  if (!exports || typeof exports === 'string') return {};

  if (isExportsConditions(exports)) {
    // leave to the main field replacment
    return {};
  }

  let replacement = {};

  Object.keys(exports).forEach(key => {
    // leave {".": ...} to the main field replacment
    if (key === '.') return;

    if (key[0] !== '.') {
      throw new Error("Unexpected exports subpath: " + key);
    }

    let target = pickCondition(exports[key]);

    let sourceModule = filePathToModuleId(key);

    if (typeof target === 'string') {
      let targetModule = filePathToModuleId(target);
      if (!targetModule.startsWith('.')) {
        // replacement is always local
        targetModule = './' + targetModule;
      }

      // Only replace when sourceModule cannot be resolved to targetModule.
      if (!nodejsIds(sourceModule).includes(targetModule)) {
        replacement[sourceModule] = targetModule;
      }
    } else {
      replacement[sourceModule] = null;
    }
  });

  return replacement;
}

function filePathToModuleId(filePath) {
  return parse(filePath.replace(/\\/g, '/')).bareId;
}

function normalizeExt(path) {
  const e = ext(path);
  if (e === '.mjs' || e === '.cjs') return '.js';
  return e;
}

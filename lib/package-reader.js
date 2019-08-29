const {ext, parse, resolveModuleId, relativeModuleId} = require('dumber-module-loader/dist/id-utils');
const {stripJsExtension, isPackageName, stripSourceMappingUrl, getSourceMap} = require('./shared');
const {error} = require('./log');
const path = require('path');

module.exports = class PackageReader {
  constructor(loadFile) {
    this.loadFile = loadFile;
    this._readFile = this._readFile.bind(this);
  }

  banner() {
    const {version, name} = this;
    return `  ${version}${' '.repeat(version.length < 10 ? (10 - version.length) : 0)} ${name}`;
  }

  ensureMainPath() {
    if (this.hasOwnProperty('mainPath')) return Promise.resolve();

    return this.loadFile('package.json')
      .then(file => {
        let metadata = JSON.parse(file.contents);
        this.name = metadata.name;
        this.version = metadata.version || 'N/A';
        this.browserReplacement = _browserReplacement(metadata.browser);
      })
      // when main file is missing, falls back to default index.js
      .then(() => this._nodejsLoadAsDirectory('').catch(() => 'index.js'))
      .then(mainPath => {
        const replacement = this.browserReplacement['./' + stripJsExtension(mainPath)];
        if (replacement) {
           // replacement is always local, remove leading ./
          mainPath = replacement.slice(2) + '.js';
        }
        this.mainPath = mainPath;
        this.parsedMainId = parse(stripJsExtension(mainPath));
        return this;
      });
  }

  readMain() {
    return this.ensureMainPath()
      .then(() => this._readFile(this.mainPath))
      .then(unit => {
        // add alias from package name to main file module id.
        // but don't add alias from "foo" to "foo/main.css".
        const mExt = ext(unit.moduleId);
        const pExt = ext(this.name);
        if (mExt === pExt || (pExt === '.js' && !mExt)) {
          unit.alias = this.name;
        }
        return unit;
      });
  }

  readResource(resource) {
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

        let fullResource = stripJsExtension(resParts.join('/'));

        const replacement = this.browserReplacement['./' + fullResource];
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
      if (unit.moduleId !== requested) {
        // The requested id could be different from real id.
        // for example, some browser replacement.
        // e.g. readable-stream/readable -> readable-stream/readable-browser
        unit.alias = requested;
      }
      return unit;
    });
  }

  // readFile contents, cleanup dep, normalise browser replacement
  _readFile(filePath) {
    return this.loadFile(filePath).then(file => {
      const moduleId = this.name + '/' + parse(stripJsExtension(filePath)).bareId;

      let replacement;
      if (ext(filePath) === '.js') {
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
        sourceMap: getSourceMap(file.contents, file.path)
      };

      // the replacement will be picked up by transformers/replace.js
      if (replacement) unit.replacement = replacement;
      return unit;
    });
  }

  // https://nodejs.org/dist/latest-v10.x/docs/api/modules.html
  // after "high-level algorithm in pseudocode of what require.resolve() does"
  _nodejsLoadAsFile(filePath) {
    return this.loadFile(filePath).then(
      () => filePath,
      () => {
        const jsFilePath = filePath + '.js';
        return this.loadFile(jsFilePath).then(
          () => jsFilePath,
          () => {
            const jsonFilePath = filePath + '.json';
            return this.loadFile(jsonFilePath).then(
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
    return this.loadFile(indexJsFilePath).then(
      () => indexJsFilePath,
      () => {
        const indexJsonFilePath = path.join(dirPath, 'index.json');
        return this.loadFile(indexJsonFilePath).then(
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
    return this.loadFile(packageJsonPath).then(
      file => {
        let metadata;
        try {
          metadata = JSON.parse(file.contents);
        } catch (err) {
          error('Failed to parse ' + packageJsonPath);
          error(err);
          throw err;
        }
        let metaMain;
        // try 1.browser > 2.module > 3.main
        // the order is to target browser.
        // it probably should use different order for electron app
        // for electron 1.module > 2.browser > 3.main
        if (typeof metadata.browser === 'string')  {
          // use package.json browser field if possible.
          metaMain = metadata.browser;
        } else if (typeof metadata.module === 'string' &&
          !(metadata.name && metadata.name.startsWith('aurelia-'))) {
          // prefer es module format over cjs, just like webpack.
          // this improves compatibility with TypeScript.
          // ignores aurelia-* core npm packages as their module
          // field is pointing to es2015 folder.
          metaMain = metadata.module;
        } else if (typeof metadata.main === 'string') {
          metaMain = metadata.main;
        }

        let mainFile = metaMain || 'index';
        // path.join also cleans up leading './'.
        const mainResourcePath = path.join(dirPath, mainFile);

        return this._nodejsLoadAsFile(mainResourcePath)
          .catch(() => this._nodejsLoadIndex(mainResourcePath));
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
};

// https://github.com/defunctzombie/package-browser-field-spec
function _browserReplacement(browser) {
  // string browser field is alternative main
  if (!browser || typeof browser === 'string') return {};

  let replacement = {};

  Object.keys(browser).forEach(key => {
    const target = browser[key];

    let sourceModule = filePathToModuleId(key);

    if (typeof target === 'string') {
      let targetModule = filePathToModuleId(target);
      if (!targetModule.startsWith('.')) {
        // replacement is always local
        targetModule = './' + targetModule;
      }
      replacement[sourceModule] = targetModule;
    } else {
      replacement[sourceModule] = false;
    }
  });

  return replacement;
}

function filePathToModuleId(filePath) {
  let moduleId = parse(filePath.replace(/\\/g, '/')).bareId;

  // remove tailing '.js', but only when dep is not
  // referencing a npm package main
  if (!isPackageName(moduleId) && moduleId.toLowerCase().endsWith('.js')) {
    moduleId = moduleId.slice(0, -3);
  }

  return moduleId;
}
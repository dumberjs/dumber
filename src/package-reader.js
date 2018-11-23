import {parse} from 'dumber-module-loader/dist/id-utils';
import {stripJsExtension} from './shared';
import path from 'path';

export default class PackageReader {
  constructor(locator) {
    this.locator = locator;
    this._readFile = this._readFile.bind(this);
  }

  _ensureMainPath() {
    if (this.hasOwnProperty('mainPath')) return Promise.resolve();

    return this.locator('package.json')
      .then(file => {
        let metadata = JSON.parse(file.contents);
        this.name = metadata.name;
      })
      .then(() => this._nodejsLoadAsDirectory(''))
      .then(mainPath => {
        this.mainPath = mainPath;
        this.parsedMainId = parse(stripJsExtension(mainPath));
      });
  }

  readMain() {
    return this._ensureMainPath().then(() =>
      this.locator(this.mainPath).then(file => ({
        path: file.path,
        contents: file.contents,
        moduleId: this.name + '/' + this.parsedMainId.bareId,
        packageName: this.name
      }))
    );
  }

  readResource(resource) {
    return this._ensureMainPath().then(() => {
      let parts = this.parsedMainId.parts;
      let len = parts.length;
      let i = 0;

      const findResource = () => {
        if (i >= len) new Promise.reject(new Error("could not find " + resource));

        let resParts = parts.slice(0, i);
        resParts.push(resource);

        let fullResource = resParts.join('/');

        return this._nodejsLoad(fullResource).then(
          filePath => this._readFile(filePath),
          () => {
            i += 1;
            return findResource();
          }
        );
      }

      return findResource();
    });
  }

  _readFile(filePath) {
    return this.locator(filePath).then(file => ({
      path: file.path,
      contents: file.contents,
      moduleId: this.name + '/' + parse(stripJsExtension(filePath)).bareId,
      packageName: this.name
    }));
  }

  // https://nodejs.org/dist/latest-v10.x/docs/api/modules.html
  // after "high-level algorithm in pseudocode of what require.resolve() does"
  _nodejsLoadAsFile(filePath) {
    return this.locator(filePath).then(
      () => filePath,
      () => {
        const jsFilePath = filePath + '.js';
        return this.locator(jsFilePath).then(
          () => jsFilePath,
          () => {
            const jsonFilePath = filePath + '.json';
            return this.locator(jsonFilePath).then(
              () => jsonFilePath
            );
          }
        );
      }
    );
  }

  _nodejsLoadIndex(dirPath) {
    const indexJsFilePath = path.join(dirPath, 'index.js');
    return this.locator(indexJsFilePath).then(
      () => indexJsFilePath,
      () => {
        const indexJsonFilePath = path.join(dirPath, 'index.json');
        return this.locator(indexJsonFilePath).then(
          () => indexJsonFilePath
        );
      }
    );
  }

  _nodejsLoadAsDirectory(dirPath) {
    const packageJsonPath = path.join(dirPath, 'package.json');

    return this.locator(packageJsonPath).then(
      file => {
        let metadata;
        try {
          metadata = JSON.parse(file.contents);
        } catch (err) {
          console.error(err);
          return;
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
        const mainResourcePath = path.join(dirPath, mainFile);

        return this._nodejsLoadAsFile(mainResourcePath)
          .catch(() => this._nodejsLoadIndex(mainResourcePath));
      },
      () => this._nodejsLoadIndex(dirPath)
    );
  }

  _nodejsLoad(filePath) {
    return this._nodejsLoadAsFile(filePath)
      .catch(() => this._nodejsLoadAsDirectory(filePath));
  }
}

/* global fetch */
const {ext} = require('dumber-module-loader/dist/id-utils');
const {encode} = require('base64-arraybuffer');

// use in browser only
let prefix = '//cdn.jsdelivr.net/npm/';

function fetchContent(fetchApi, fp) {
  return fetchApi(fp)
  .then(function (response) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    if (response.redirected) {
      // jsdelivr redirects directory access to a html page that
      // lists all files in the directory
      throw new Error('it is a directory');
    }

    if (ext(fp) === '.wasm') {
      return response.arrayBuffer().then(buffer => encode(buffer));
    }
    return response.text();
  });
}

// use jsDelivr to find npm package files
module.exports = function(packageConfig, mock) {
  // decoupling for testing
  let _fetch = mock && mock.fetch;

  if (!_fetch && typeof fetch === 'function') {
    // get global fetch api
    _fetch = fetch;
  }

  if (typeof _fetch !== 'function') {
    throw new Error('Your browser is not supported: no JavaScript fetch API')
  }

  const _readFile = fp => fetchContent(_fetch, fp);

  const name = packageConfig.name;
  let packagePath;
  if (packageConfig.location) {
    packagePath = prefix + packageConfig.location;
  } else {
    packagePath = prefix + name;
  }

  let version = packageConfig.version;

  if (version) {
    packagePath += '@' + version;
  }

  // TODO support hard coded main

  return _readFile(packagePath + '/package.json')
  .then(json => {
    const packageInfo = JSON.parse(json);
    if (!version) {
      // fillup version
      version = packageInfo.version;
      packagePath += '@' + version;
    }

    return function(filePath) {
      const fp = packagePath + '/' + filePath;
      return _readFile(fp).then(text => {
        if (filePath === 'package.json' || filePath === './package.json') {
          const meta = JSON.parse(text);
          if (meta.name !== name) {
            meta.name = name;
            text = JSON.stringify(meta);
          }
        }
        return {path: fp, contents: text};
      });
    }
  });
};

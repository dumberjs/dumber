/* global fetch */
const {ext} = require('dumber-module-loader/dist/id-utils');
const {encode} = require('base64-arraybuffer');

// use in browser only
let prefix = '//cdn.jsdelivr.net/npm/';

function fetchContent(fetchApi, fp) {
  return fetchApi(fp)
  .then(function (response) {
    if (!response.ok) {
      throw new Error('Failed to fetch ' + fp + '\n' + response.statusText);
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
  let version = packageConfig.version;
  const dumberForcedMain = packageConfig.main;

  let packagePath;
  if (packageConfig.location) {
    const m = packageConfig.location.match(/^(.+)@(\d[^@]*)$/);
    if (m) {
      packagePath = prefix + m[1];
      version = m[2];
    } else {
      packagePath = prefix + packageConfig.location;
    }
  } else {
    packagePath = prefix + name;
  }

  if (version) {
    packagePath += '@' + version;
  }

  return _readFile(packagePath + '/package.json')
  .then(json => {
    const packageInfo = JSON.parse(json);
    if (!version) {
      // fillup version
      version = packageInfo.version;
      packagePath += '@' + version;
    }

    return function(filePath) {
      if (filePath.startsWith('./')) filePath = filePath.slice(2);
      const fp = packagePath + '/' + filePath;
      return _readFile(fp).then(text => {
        if (filePath === 'package.json' || filePath === './package.json') {
          const meta = JSON.parse(text);
          if (meta.name !== name) {
            meta.name = name;
          }
          if (dumberForcedMain) {
            meta.dumberForcedMain = dumberForcedMain;
          }
          return {path: fp, contents: JSON.stringify(meta)};
        }
        return {path: fp, contents: text};
      });
    }
  });
};

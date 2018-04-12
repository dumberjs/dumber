/* global fetch */
'use strict';
// use in browser only
let prefix = '//cdn.jsdelivr.net/npm/';

// use jsDelivr to find npm package files
module.exports = function (packageVersionMap, fetchApi) {
  if (!packageVersionMap) packageVersionMap = {};

  let _fetch = fetchApi;

  if (!_fetch && typeof fetch === 'function') {
    // get global fetch api
    _fetch = fetch;
  }

  if (typeof _fetch !== 'function') {
    throw new Error('Your browser is not supported: no JavaScript fetch API')
  }

  function fetchText(url) {
    return _fetch(url)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.text();
    });
  }

  function fetchJson(url) {
    return fetchText(url).then(function(text) {
      return JSON.parse(text);
    });
  }

  return function (packageName) {
    let packagePath = prefix + packageName;
    let version = packageVersionMap[packageName];

    if (version) {
      packagePath += '@' + version;
    }

    return fetchJson(packagePath + '/package.json')
    .then(function (packageInfo) {
      if (!version) {
        // fillup version
        version = packageInfo.version;
        packagePath += '@' + version;
      }

      return function(filePath) {
        const fp = packagePath + '/' + filePath;
        return fetchText(fp).then(function (text) {
          return {
            path: fp,
            contents: text
          }
        });
      }
    });
  };
};


/* global fetch */
import {ext} from 'dumber-module-loader/dist/id-utils';
import {encode} from 'base64-arraybuffer';

// use in browser only
let prefix = '//cdn.jsdelivr.net/npm/';

function fetchContent(fetchApi, url) {
  return fetchApi(url)
  .then(function (response) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    if (response.redirected) {
      // jsdelivr redirects directory access to a html page that
      // lists all files in the directory
      throw new Error('it is a directory');
    }

    if (ext(url) === '.wasm') {
      return response.arrayBuffer().then(buffer => encode(buffer));
    }
    return response.text();
  });
}

function fetchJson(fetchApi, url) {
  return fetchContent(fetchApi, url).then(function(text) {
    return JSON.parse(text);
  });
}

// use jsDelivr to find npm package files
export default function (packageConfig, mock) {
  // decoupling for testing
  let _fetch = mock && mock.fetch;

  if (!_fetch && typeof fetch === 'function') {
    // get global fetch api
    _fetch = fetch;
  }

  if (typeof _fetch !== 'function') {
    throw new Error('Your browser is not supported: no JavaScript fetch API')
  }

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

  return fetchJson(_fetch, packagePath + '/package.json')
  .then(function (packageInfo) {
    if (!version) {
      // fillup version
      version = packageInfo.version;
      packagePath += '@' + version;
    }

    return function(filePath) {
      const fp = packagePath + '/' + filePath;
      return fetchContent(_fetch, fp).then(function (text) {
        return {
          path: fp,
          contents: text
        }
      });
    }
  });
}


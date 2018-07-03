/* global fetch */
// use in browser only
let prefix = '//cdn.jsdelivr.net/npm/';

function fetchText(fetchApi, url) {
  return fetchApi(url)
  .then(function (response) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.text();
  });
}

function fetchJson(fetchApi, url) {
  return fetchText(fetchApi, url).then(function(text) {
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
  let packagePath = prefix + name;
  let version = packageConfig.version;

  if (version) {
    packagePath += '@' + version;
  }

  return fetchJson(_fetch, packagePath + '/package.json')
  .then(function (packageInfo) {
    if (!version) {
      // fillup version
      version = packageInfo.version;
      packagePath += '@' + version;
    }

    return function(filePath) {
      const fp = packagePath + '/' + filePath;
      return fetchText(_fetch, fp).then(function (text) {
        return {
          path: fp,
          contents: text
        }
      });
    }
  });
}


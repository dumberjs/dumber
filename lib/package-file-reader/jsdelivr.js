/* global fetch */
const {ext} = require('dumber-module-loader/dist/id-utils');
const {encode} = require('base64-arraybuffer');

// use in browser only
const PREFIX = '//cdn.jsdelivr.net/npm/';
const DATA_PREFIX = '//data.jsdelivr.com/v1/package/npm/';
const CACHE_PREFIX = '//cache.dumber.app/npm/';

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

function buildFileSet(files, folder) {
  const set = new Set();
  const PREFIX = folder ? (folder + '/') : '';

  files.forEach(node => {
    if (node.type === 'directory') {
      buildFileSet(node.files, PREFIX + node.name)
        .forEach(f => set.add(f));
    } else if (node.type === 'file') {
      set.add(PREFIX + node.name);
    }
  });

  return set;
}

// use jsdelivr to find npm package files
module.exports = function(packageConfig, mock) {
  // decoupling for testing
  let _fetch = mock && mock.fetch;
  let _cache_prefix = (mock && mock.cachePrefix) || CACHE_PREFIX;

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
      packagePath = m[1];
      version = m[2];
    } else {
      packagePath = packageConfig.location;
    }
  } else {
    packagePath = name;
  }

  if (version) {
    packagePath += '@' + version;
  }

  let packageJson;
  return _readFile(PREFIX + packagePath + '/package.json')
  .then(json => {
    packageJson = json;
    const packageInfo = JSON.parse(json);
    if (!version) {
      // fillup version
      version = packageInfo.version;
      packagePath += '@' + version;
    } else if (version !== packageInfo.version) {
      packagePath.slice(0, -version.length) + packageInfo.version;
      version = packageInfo.version;
    }

    return _fetch(DATA_PREFIX + packagePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch files list ' + DATA_PREFIX + packagePath + '\n' + response.statusText);
        }
        return response.json();
      })
      .then(result => buildFileSet(result.files));
  })
  .then(files => {
    const fileReader = filePath => {
      if (filePath.startsWith('./')) filePath = filePath.slice(2);

      if (!files.has(filePath)) {
        return Promise.reject(new Error('no file "' + filePath + '" in ' + packagePath));
      }

      const fp = PREFIX + packagePath + '/' + filePath;
      const cacheFp = _cache_prefix + packagePath + '/' + filePath;

      if (filePath === 'package.json') {
        const meta = JSON.parse(packageJson);
        if (meta.name !== name) {
          meta.name = name;
        }
        if (dumberForcedMain) {
          meta.dumberForcedMain = dumberForcedMain;
        }
        return Promise.resolve({path: fp, contents: JSON.stringify(meta)});
      }

      // Try cached traced result first.
      return _readFile(cacheFp).then(
        text => JSON.parse(text),
        () => _readFile(fp).then(text => ({path: fp, contents: text}))
      );
    };

    fileReader.packageConfig = packageConfig;
    return Promise.resolve(fileReader);
  });
};

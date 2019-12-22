/* global fetch */
const {ext} = require('dumber-module-loader/dist/id-utils');
const {encode} = require('base64-arraybuffer');

// use in browser only
const prefix = '//cdn.jsdelivr.net/npm/';
const data_prefix = '//data.jsdelivr.com/v1/package/npm/';

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
  const prefix = folder ? (folder + '/') : '';

  files.forEach(node => {
    if (node.type === 'directory') {
      buildFileSet(node.files, prefix + node.name)
        .forEach(f => set.add(f));
    } else if (node.type === 'file') {
      set.add(prefix + node.name);
    }
  });

  return set;
}

// use jsdelivr to find npm package files
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

  return _readFile(prefix + packagePath + '/package.json')
  .then(json => {
    const packageInfo = JSON.parse(json);
    if (!version) {
      // fillup version
      version = packageInfo.version;
      packagePath += '@' + version;
    } else if (version !== packageInfo.version) {
      packagePath.slice(0, -version.length) + packageInfo.version;
      version = packageInfo.version;
    }

    return _fetch(data_prefix + packagePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch files list ' + data_prefix + packagePath + '\n' + response.statusText);
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

      const fp = prefix + packagePath + '/' + filePath;
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
    };

    fileReader.packageConfig = packageConfig;
    return Promise.resolve(fileReader);
  });
};

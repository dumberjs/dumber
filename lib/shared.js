const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');
const {ensureParsed} = require('ast-matcher');
const convert = require('convert-source-map');
const url = require('url');
require('./ensure-parser-set')();

exports.stripJsExtension = function(d) {
   return d && d.endsWith('.js') ? d.slice(0, -3) : d;
};

exports.isPackageName = function(path) {
  if (path.startsWith('.')) return false;
  const parts = path.split('/');
  // package name, or scope package name
  return parts.length === 1 || (parts.length === 2 && parts[0].startsWith('@'));
};

function fsReadFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  })
}

exports.fsReadFile = fsReadFile;

exports.contentOrFile = function(pathOrContent, mock) {
  // decoupling for testing
  let _readFile = (mock && mock.readFile) || fsReadFile;

  if (typeof pathOrContent !== 'string' || !pathOrContent) {
    return Promise.reject(new Error('No content or file provided'));
  }

  // pathOrContent is a path
  if (pathOrContent.match(/^https?:\/\//)) {
    // remote url
    const remote = url.parse(pathOrContent);
    const remotePath = remote.hostname + remote.pathname;

    return fetch(pathOrContent)
    .then(response => {
      if (response.ok) return response.text();
      else throw new Error(response.statusText)
    })
    .then(text => {
      ensureParsed(text);
      // pathOrContent is code
      return text;
    })
    .then(text => ({
      path: remotePath,
      contents: ensureSemicolon(stripSourceMappingUrl(text || '')),
    }));
  }

  if (pathOrContent.endsWith('.js')) {
    return _readFile(pathOrContent)
    .then(buffer => buffer.toString())
    .then(text => ({
      path: pathOrContent.replace(/\\/g, '/'),
      contents: ensureSemicolon(stripSourceMappingUrl(text || '')),
      sourceMap: getSourceMap(text, pathOrContent)
    }));
  }

  return new Promise(resolve => {
    ensureParsed(pathOrContent);
    resolve({
      contents: ensureSemicolon(stripSourceMappingUrl(pathOrContent || ''))
    });
  });
};

exports.generateHash = function(bufOrStr) {
  return crypto.createHash('md5').update(bufOrStr).digest('hex');
};

function stripSourceMappingUrl(contents) {
  return convert.removeMapFileComments(convert.removeComments(contents));
}

exports.stripSourceMappingUrl = stripSourceMappingUrl;

function getSourceMap(contents, filePath) {
  const dir = (filePath && path.dirname(filePath)) || '';

  const sourceMap = (() => {
    try {
      let converter = convert.fromSource(contents);
      if (converter) return converter.sourcemap;

      if (filePath) {
        converter = convert.fromMapFileSource(contents, dir);
        if (converter) return converter.sourcemap;
      }
    } catch (err) {
      return;
    }
  })();

  if (sourceMap && sourceMap.sources) {
    const {sourceRoot} = sourceMap;
    if (sourceRoot) {
      // get rid of sourceRoot
      if (sourceRoot !== '/') {
        sourceMap.sources = sourceMap.sources.map(s => path.join(sourceRoot, s).replace(/\\/g, '/'));
      }
      delete sourceMap.sourceRoot;
    }

    sourceMap.sources = sourceMap.sources.map(s => path.join(dir, s).replace(/\\/g, '/'));
    if (filePath) {
      sourceMap.file = filePath.replace(/\\/g, '/');
    }

    if (!sourceMap.sourcesContent) {
      // bring in sources content inline
      try {
        sourceMap.sourcesContent = sourceMap.sources.map(s =>
          fs.readFileSync(s, 'utf8')
        );
      } catch (err) {
        //
      }
    }
  }

  return sourceMap;
}

exports.getSourceMap = getSourceMap;

function ensureSemicolon(contents) {
  let trimed = contents.trim();
  if (trimed.slice(-1) === ';') return trimed;
  return trimed + ';';
}

exports.ensureSemicolon = ensureSemicolon;

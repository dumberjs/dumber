import fs from 'fs';
import path from 'path';
import resolve from 'resolve';
import fetch from 'node-fetch';
import crypto from 'crypto';
import {ensureParsed} from 'ast-matcher';
import convert from 'convert-source-map';
import {join as sourcePathJoin} from 'source-map/lib/util';
import './ensure-parser-set';

export function stripJsExtension(d) {
   return d && d.endsWith('.js') ? d.slice(0, -3) : d;
}

export function isPackageName(path) {
  if (path.startsWith('.')) return false;
  const parts = path.split('/');
  // package name, or scope package name
  return parts.length === 1 || (parts.length === 2 && parts[0].startsWith('@'));
}

export function resolvePackagePath(packageName) {
  let metaPath;
  // we resolve package.json instead of package's main file,
  // as some npm package (like font-awesome v4) has no main file.
  const packageJson = packageName + '/package.json';

  try {
    try {
      // try from dumber first
      metaPath = require.resolve(packageJson);
    } catch (e) {
      // try from app's local folder, this is necessary to support lerna
      // hoisting where dumber is out of app's local node_modules folder.
      metaPath = resolve(packageJson, {basedir: process.cwd()});
    }
  } catch (e) {
    throw new Error('cannot find npm package: ' + packageName);
  }
  return metaPath.slice(0, -13);
}

export function fsReadFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  })
}

export function contentOrFile(pathOrContent, mock) {
  // decoupling for testing
  let _readFile = (mock && mock.readFile) || fsReadFile;

  if (typeof pathOrContent !== 'string' || !pathOrContent) {
    return Promise.reject(new Error('No content or file provided'));
  }

  let p;
  let filePath;
  // pathOrContent is a path
  if (pathOrContent.match(/^https?:\/\//)) {
    // remote url
    p = fetch(pathOrContent)
    .then(response => {
      if (response.ok) return response.text();
      else throw new Error(response.statusText)
    })
    .then(text => {
      ensureParsed(text);
      // pathOrContent is code
      return text;
    });
  } else if (pathOrContent.endsWith('.js')) {
    filePath = pathOrContent;
    p = _readFile(pathOrContent)
    .then(buffer => buffer.toString());
  } else {
    p = new Promise(resolve => {
      ensureParsed(pathOrContent);
      resolve(pathOrContent);
    });
  }

  return p.then(text => ({
    path: filePath && filePath.replace(/\\/g, '/'),
    contents: ensureSemicolon(stripSourceMappingUrl(text || '')),
    sourceMap: getSourceMap(text, filePath)
  }));
}

export function generateHash(bufOrStr) {
  return crypto.createHash('md5').update(bufOrStr).digest('hex');
}

export function stripSourceMappingUrl(contents) {
  return contents.replace(/\/\/(#|@)\s*sourceMappingURL=\S+\s*$/gm, '')
    .replace(/\/\*(#|@)\s*sourceMappingURL=\S+\s*\*\//g, '');
}

export function getSourceMap(contents, filePath) {
  const dir = filePath && path.dirname(filePath);

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
        sourceMap.sources = sourceMap.sources.map(s => sourcePathJoin(sourceRoot, s));
      }
      delete sourceMap.sourceRoot;
    }

    if (!sourceMap.sourcesContent) {
      // bring in sources content inline
      try {
        sourceMap.sourcesContent = sourceMap.sources.map(s =>
          fs.readFileSync(path.resolve(dir, s), 'utf8')
        );
      } catch (err) {
        //
      }
    }
  }

  return sourceMap;
}

export function ensureSemicolon(contents) {
  let trimed = contents.trim();
  if (trimed.slice(-1) === ';') return trimed;
  return trimed + ';';
}

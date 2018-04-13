'use strict';

const KNOWN_EXTS = ['.js', '.json', '.html', '.htm', '.svg', '.css'];
const idWithPlugin = /^(\w+!)(.+)$/;

function ext (id) {
  const parts = id.split('/');
  const last = parts.pop();
  const dotPos = last.lastIndexOf('.');
  if (dotPos !== -1) {
    const ext = last.substring(dotPos).toLowerCase();
    if (KNOWN_EXTS.indexOf(ext) !== -1) return ext;
  }
  return '';
}

function parse (id) {
  let prefix = '';
  let bareId = id;
  let m = id.match(idWithPlugin);
  if (m) {
    prefix = m[1];
    bareId = m[2];
  }

  let extname = ext(bareId);
  if (extname === '.js') {
    bareId = bareId.substr(0, bareId.length - 3);
  }

  return {
    prefix: prefix,
    bareId: bareId,
    ext: extname !== '.js' ? extname : ''
  }
}

function idWithOutPluginPrefix (id) {
  let m = id.match(idWithPlugin);
  if (m) return m[2];
  return id;
}

function resolveModuleId (baseId, relativeId) {
  baseId = idWithOutPluginPrefix(baseId);

  let parsed = parse(relativeId);

  if (parsed.bareId[0] !== '.') return parsed.prefix + parsed.bareId;

  let parts = baseId.split('/');
  if (parts[0].startsWith('@') && parts.length > 1) {
    let scope = parts.shift();
    parts[0] = scope + '/' + parts[0];
  }
  parts.pop();

  parsed.bareId.split('/').forEach(function (p) {
    if (p === '..') {
      if (parts.length === 0) {
        throw new Error('could not resolve relativeId: "' + relativeId + '" on baseId: "' + baseId + '"');
      }
      parts.pop();
    } else if (p !== '.') {
      parts.push(p);
    }
  })

  // console.log(parsed);
  // console.log(parts);
  return parsed.prefix + parts.join('/');
}

exports.ext = ext;
exports.parse = parse;
exports.resolveModuleId = resolveModuleId;

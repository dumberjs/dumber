'use strict';

const idWithPlugin = /^(\w+)!(.+)$/;

module.exports = function (baseId, relativeId) {
  let bm = baseId.match(idWithPlugin);
  if (bm) {
    baseId = bm[2];
  }

  let m = relativeId.match(idWithPlugin);
  let prefix = '';
  let bareId = relativeId;
  if (m) {
    prefix = m[1] + '!';
    bareId = m[2];
  }

  if (bareId[0] !== '.') return relativeId;

  let parts = baseId.split('/');
  if (parts[0].startsWith('@') && parts.length > 1) {
    let scope = parts.shift();
    parts[0] = scope + '/' + parts[0];
  }
  parts.pop();

  bareId.split('/').forEach(function (p) {
    if (p === '..') {
      if (parts.length === 0) {
        throw new Error('could not resolve relativeId: "' + relativeId + '" on baseId: "' + baseId + '"');
      }
      parts.pop();
    } else if (p !== '.') {
      parts.push(p);
    }
  })

  return prefix + parts.join('/');
};

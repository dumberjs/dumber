'use strict';

module.exports = function (baseId, relativeId) {
  if (relativeId[0] !== '.') return relativeId;

  let parts = baseId.split('/');
  if (parts[0].startsWith('@') && parts.length > 1) {
    let scope = parts.shift();
    parts[0] = scope + '/' + parts[0];
  }
  parts.pop();

  relativeId.split('/').forEach(function (p) {
    if (p === '..') {
      if (parts.length === 0) {
        throw new Error('could not resolve relativeId: "' + relativeId + '" on baseId: "' + baseId + '"');
      }
      parts.pop();
    } else if (p !== '.') {
      parts.push(p);
    }
  })

  return parts.join('/');
};

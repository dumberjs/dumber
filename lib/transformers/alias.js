'use strict';
const idUtils = require('../id-utils');

// wrap html/svg/css into amd
module.exports = function (fromId, toId) {
  // fromId, toId, are clean id without .js extname, without text! prefix

  const parsedFromId = idUtils.parse(fromId);
  const parsedToId = idUtils.parse(toId);

  if (parsedFromId.ext !== parsedToId.ext) {
    throw new Error('cannot create alias between ids with different extname: "' + fromId + '", "' + toId + '"');
  }

  // if got ext, then ext is not .js, we need wrapper
  if (parsedFromId.ext) {
    let defined = ['text!' + parsedFromId.bareId, parsedFromId.bareId];
    let contents = "define('text!" + parsedFromId.bareId + "',['text!" + parsedToId.bareId +
                     "'],function(m){return m;});\n" +
                     "define('" + parsedFromId.bareId + "',['" + parsedToId.bareId +
                     "'],function(m){return m;});\n"

    if (parsedFromId.ext === '.json') {
      defined.push('json!' + parsedFromId.bareId);
      contents += "define('json!" + parsedFromId.bareId + "',['json!" + parsedToId.bareId +
                  "'],function(m){return m;});\n";
    }

    return {
      defined: defined,
      contents: contents
    };
  } else {
    return {
      defined: parsedFromId.bareId,
      contents: "define('" + parsedFromId.bareId + "',['" + parsedToId.bareId +
                "'],function(m){return m;});\n"
    };
  }

};

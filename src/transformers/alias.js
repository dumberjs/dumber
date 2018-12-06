import {parse} from 'dumber-module-loader/dist/id-utils';
import {stripJsExtension} from '../shared';

export default function (fromId, toId) {
  // fromId, toId, are clean id without .js extname, without text! prefix

  const parsedFromId = parse(stripJsExtension(fromId));
  const parsedToId = parse(stripJsExtension(toId));

  if (parsedFromId.ext !== parsedToId.ext) {
    throw new Error(`cannot create alias between ids with different extname: "${fromId}", "${toId}"`);
  }

  // if got ext, then ext is not .js, we need wrapper
  if (parsedFromId.ext) {
    let defined = 'text!' + parsedFromId.bareId;
    let contents = "define('text!" + parsedFromId.bareId + "',['text!" + parsedToId.bareId +
                     "'],function(m){return m;});\n";

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
}

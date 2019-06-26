import {parse} from 'dumber-module-loader/dist/id-utils';
import {stripJsExtension} from '../shared';

export default function (unit) {
  const {alias, defined, contents} = unit;
  if (!alias || !defined || !defined.length) return;

  // fromId, toId, are clean id without .js extname, without text! prefix
  const fromId = alias;
  const toId = defined[0];
  const parsedFromId = parse(stripJsExtension(fromId));
  const parsedToId = parse(stripJsExtension(toId));

  if (parsedFromId.bareId === parsedToId.bareId) {
    return {alias: null}; // no need alias
  }

  if (parsedFromId.ext !== parsedToId.ext) {
    throw new Error(`cannot create alias between ids with different extname: "${fromId}", "${toId}"`);
  }

  // if got ext, then ext is not .js, we need wrapper
  let prefix = '';
  if (parsedFromId.ext) {
    if (parsedFromId.ext === '.wasm') {
      prefix = 'raw!';
    } else {
      prefix = 'text!'; // this includes json resource
    }
  }

  const newId = prefix + parsedFromId.bareId;
  const existingId = prefix + parsedToId.bareId;
  const code = `\n;define.alias('${newId}','${existingId}');`;

  // modifyCode is skipped, because there is only append,
  // no source map change needed.
  return {
    defined: [newId],
    contents: contents + code,
    alias: null // clear alias field
  };

}

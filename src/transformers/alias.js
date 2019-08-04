import {parse} from 'dumber-module-loader/dist/id-utils';
import {stripJsExtension} from '../shared';

export default function (unit) {
  const {alias, defined, contents} = unit;
  if (!alias || !defined || !defined.length) return;

  let aliases = alias;
  if (typeof alias === 'string') {
    aliases = [alias];
  }

  const toId = defined[0];
  const parsedToId = parse(stripJsExtension(toId));
  // if got ext, then ext is not .js, we need wrapper
  let prefix = '';
  if (parsedToId.ext) {
    if (parsedToId.ext === '.wasm') {
      prefix = 'raw!';
    } else {
      prefix = 'text!'; // this includes json resource
    }
  }
  const existingId = prefix + parsedToId.bareId;

  const newlyDefined = [];
  let newContents = contents;
  // fromId, toId, are clean id without .js extname, without text! prefix
  for (const fromId of aliases) {
    const parsedFromId = parse(stripJsExtension(fromId));

    if (parsedFromId.bareId === parsedToId.bareId) {
      continue; // no need alias
    }

    if (parsedFromId.ext !== parsedToId.ext) {
      throw new Error(`cannot create alias between ids with different extname: "${fromId}", "${toId}"`);
    }

    const newId = prefix + parsedFromId.bareId;
    const code = `\n;define.alias('${newId}','${existingId}');`;
    newlyDefined.push(newId);
    newContents += code;
  }

  if (newlyDefined.length === 0) {
    return {alias: null};
  }

  // modifyCode is skipped, because there is only append,
  // no source map change needed.
  return {
    defined: newlyDefined,
    contents: newContents,
    alias: null // clear alias field
  };

}

module.exports = function alias(unit) {
  const {alias, defined, contents} = unit;
  if (!alias || !defined || !defined.length) return;

  let aliases = alias;
  if (typeof alias === 'string') {
    aliases = [alias];
  }

  let newContents = contents;
  const newlyDefined = [];

  defined.forEach(toId => {
    // if got ext, then ext is not .js, we need wrapper
    let prefix = '';
    const m = toId.match(/^(\w+!)/);
    if (m) {
      prefix = m[1];
    }


    for (const fromId of aliases) {
      if (fromId === toId) {
        continue; // no need alias
      }

      let newId = (fromId.startsWith(prefix) ? '' : prefix) + fromId;
      const code = `\n;define.alias('${newId}','${toId}');`;
      newlyDefined.push(newId);
      newContents += code;
    }
  })


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
};

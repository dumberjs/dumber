module.exports = function alias(unit) {
  const {alias, defined, moduleId, contents} = unit;
  if (!alias || !defined || !defined.length) return;

  let aliases = alias;
  if (typeof alias === 'string') {
    aliases = [alias];
  }

  let newContents = contents;
  const newlyDefined = [];

  const toIds = [defined[0]];
  if (moduleId !== defined[0] && defined[0].endsWith(moduleId)) {
    // when defined[0] is prefixed moduleId
    toIds.push(moduleId);
  }

  toIds.forEach(toId => {
    // if got ext, then ext is not .js, we need wrapper
    let prefix = '';
    const m = toId.match(/^(\w+!)/);
    if (m) {
      prefix = m[1];
    }


    for (const fromId of aliases) {
      let newId = (fromId.startsWith(prefix) ? '' : prefix) + fromId;

      if (
        newId === moduleId ||
        defined.includes(newId) ||
        newlyDefined.includes(newId)
      ) {
        continue; // no need alias
      }

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

// wrap html/svg/css into amd
module.exports = function text(unit) {
  const {moduleId, contents, sourceMap, path} = unit;

  const newUnit = {
    defined: ['text!' + moduleId],
    contents: `define('text!${moduleId}',function(){return ${JSON.stringify(contents)};});`,
    deps: []
  };

  if (!sourceMap) {
    const filename = path.replace(/\\/g, '/');
    // an identity source map to just showing the original file in browser dev console.
    // there would not be any runtime error leading to this mapping.
    newUnit.sourceMap = {
      version: 3,
      file: filename,
      sources: [filename],
      mappings: 'AAAA',
      names: [],
      sourcesContent: [contents]
    };
  }

  return newUnit;
};

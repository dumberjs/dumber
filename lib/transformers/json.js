// wrap html/svg/css into amd
module.exports = function json(unit) {
  const {moduleId, contents, sourceMap, path} = unit;

  const newUnit = {
    defined: [moduleId],
    contents: `define('${moduleId}',function(){return JSON.parse(${JSON.stringify(contents)});});`,
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

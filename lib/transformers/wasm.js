// wrap wasm into amd
module.exports = function (unit) {
  const {moduleId, contents, sourceMap, path} = unit;

  const newUnit = {
    defined: ['raw!' + moduleId],
    contents: `define('raw!${moduleId}',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(${JSON.stringify(contents)}));}}});`,
    deps: ['base64-arraybuffer']
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

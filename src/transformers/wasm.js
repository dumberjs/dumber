// wrap wasm into amd
export default function (unit) {
  const {moduleId, contents, sourceMap, path} = unit;
  const filename = (sourceMap && sourceMap.file || path).replace(/\\/g, '/');

  return {
    defined: ['raw!' + moduleId],
    contents: `define('raw!${moduleId}',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(${JSON.stringify(contents)}));}}});`,
    deps: ['base64-arraybuffer'],
    // an identity source map to just showing the original file in browser dev console.
    // there would not be any runtime error leading to this mapping.
    sourceMap: {
      version: 3,
      file: filename,
      sources: [filename],
      mappings: 'AAAA',
      names: [],
      sourcesContent: [contents]
    }
  };
}

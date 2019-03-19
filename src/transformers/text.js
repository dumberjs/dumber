// wrap html/svg/css into amd
export default function (unit) {
  const {moduleId, contents, sourceMap, path} = unit;
  const filename = (sourceMap && sourceMap.file || path).replace(/\\/g, '/');

  return {
    defined: ['text!' + moduleId],
    contents: `define('text!${moduleId}',function(){return ${JSON.stringify(contents)};});`,
    deps: [],
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

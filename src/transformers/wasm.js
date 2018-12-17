// wrap wasm into amd
export default function (moduleId, base64) {
  return {
    defined: `raw!${moduleId}`,
    contents:`define('raw!${moduleId}',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return a.decode(${JSON.stringify(base64)});}});\n`
  };
}

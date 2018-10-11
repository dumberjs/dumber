// wrap html/svg/css into amd
export default function (moduleId, contents) {
  return {
    defined: ['text!' + moduleId],
    contents:`define('text!${moduleId}',function(){return ${JSON.stringify(contents)};});\n`
  };
}

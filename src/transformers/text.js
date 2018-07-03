// wrap html/svg/css into amd
export default function (moduleId, contents) {
  return {
    defined: ['text!' + moduleId, moduleId],
    contents:'define(\'text!' + moduleId + '\',function(){return ' +
             JSON.stringify(contents) + ';});\n' +
             'define(\'' + moduleId + '\',[\'text!' + moduleId +
             '\'],function(m){return m;});\n'
  };
}

'use strict';

// wrap json into amd
module.exports = function (moduleId, contents) {
  return {
    defined: ['text!' + moduleId, moduleId, 'json!' + moduleId],
    contents:'define(\'text!' + moduleId + '\',function(){return ' +
             JSON.stringify(contents) + ';});\n' +
             'define(\'' + moduleId + '\',[\'text!' + moduleId +
             '\'],function(m){return JSON.parse(m);});\n' +
             'define(\'json!' + moduleId + '\',[\'' + moduleId +
             '\'],function(m){return m;});\n'
  };
};

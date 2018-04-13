'use strict';

// wrap json into amd
module.exports = function (moduleName, contents) {
  return {
    defined: ['text!' + moduleName, moduleName],
    contents:'define(\'text!' + moduleName + '\',function(){return ' +
             JSON.stringify(contents) + ';});\n' +
             'define(\'' + moduleName + '\',[\'text!' + moduleName +
             '\'],function(m){return JSON.parse(m);});\n'
  };
};

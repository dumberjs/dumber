'use strict';

// wrap html/svg/css into amd
module.exports = function (moduleName, contents) {
  return {
    defined: 'text!' + moduleName,
    contents:'define(\'text!' + moduleName + '\',function(){return ' +
             JSON.stringify(contents) + ';});\n'
  };
};

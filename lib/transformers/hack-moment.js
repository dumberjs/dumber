// Expose moment to global var to improve compatibility with some legacy libs.
// It also load momentjs up immediately.
module.exports = function(unit) {
  const {contents, packageName} = unit;
  if (packageName === 'moment') {
    return {
      contents: contents.replace(/\bdefine\((\w+)\)/, (match, factoryName) =>
        `(function(){var m=${factoryName}();if(typeof moment === 'undefined'){window.moment=m;} define(function(){return m;})})()`
      )
    };
  }
};

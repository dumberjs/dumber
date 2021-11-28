// Expose moment to global var to improve compatibility with some legacy libs.
// It also loads momentjs up immediately.
module.exports = function hackMoment(unit) {
  const {contents, packageName} = unit;
  if (packageName === 'moment') {
    return {
      contents: contents.replace(/\bdefine\((\w+)\)/, (match, factoryName) =>
        `(function(){var m=${factoryName}();if(typeof moment === 'undefined' && typeof global !== 'undefined'){global.moment=m;} define(function(){return m;})})()`
      )
    };
  }
};

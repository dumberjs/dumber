// Fill up NODE_ENV (and more possibly) to process.env.
module.exports = function(unit, _env /* for test */) {
  const {contents, packageName} = unit;
  // only for the process stub
  if (packageName === 'process') {
    if (!_env) {
      _env = process.env;
    }
    const fillup = {
      NODE_ENV: _env.NODE_ENV || ''
      // Note: whenever add a new env variable here,
      // have to add the variable to cache key in ../trace.js too.
      // Because env var is a factor affecting transform result.
    };
    return {
      contents: contents + `\nprocess.env = ${JSON.stringify(fillup)};\n`
    };
  }
};

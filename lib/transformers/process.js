// Fill up env.NODE_ENV, version, versions to process.
module.exports = function processEnv(unit, mock /* for test */) {
  const {contents, packageName} = unit;
  // only for the process stub
  if (packageName === 'process') {
    const _env = (mock && mock.env) || process.env;
    const _version = (mock && mock.version) || process.version;
    const _versions = (mock && mock.versions) || process.versions;

    return {
      contents: contents + `
process.env = {NODE_ENV:${JSON.stringify(_env.NODE_ENV || '')}};
process.version = ${JSON.stringify(_version)};
process.versions = ${JSON.stringify(_versions)};
process.execArgv = [];
`
    };
  }
};

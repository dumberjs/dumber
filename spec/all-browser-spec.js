require('./bundle.spec.js');
// default locator only works in Nodejs
// require('./package-locators/default.spec.js');
require('./package-locators/jsDelivr.spec.js');
require('./package-reader.spec.js');
require('./package.spec.js');
require('./parser.uses-amd-or-requirejs.spec.js');
require('./parser.uses-common-js.spec.js');
require('./parser.uses-esm.spec.js');
require('./trace.spec.js');
require('./transformers/alias.spec.js');
// something wrong with browserify + esprima/cherow
// require('./transformers/cjs-es.spec.js');
require('./transformers/defines.spec.js');
require('./transformers/text.spec.js');

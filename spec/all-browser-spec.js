require('./bundle.spec.js');
require('./package-locators/default.spec.js');
require('./package-locators/jsDelivr.spec.js');
require('./package-reader.spec.js');
require('./package.spec.js');
require('./parser.uses-amd-or-requirejs.spec.js');
require('./parser.uses-common-js.spec.js');
require('./parser.uses-esm.spec.js');
require('./trace.spec.js');
require('./transformers/alias.spec.js');
// something wrong with browserify + @babel/core
// going to switch to dumberify when it's ready
// require('./transformers/cjs-es.spec.js');
require('./transformers/defines.spec.js');
require('./transformers/text.spec.js');

require('./package-locators/default.spec');
require('./package-locators/jsDelivr.spec');
require('./package-reader.spec');
require('./package.spec');
require('./parser.uses-amd-or-requirejs.spec');
require('./parser.uses-common-js.spec');
require('./parser.uses-esm.spec');
require('./trace.spec');
require('./transformers/alias.spec');
// something wrong with browserify + @babel/core
// going to switch to dumberify when it's ready
// require('./transformers/cjs-es.spec');
require('./transformers/defines.spec');
require('./transformers/text.spec');
require('./shared.spec');
require('./stub-module.spec');
require('./inject-css.spec');

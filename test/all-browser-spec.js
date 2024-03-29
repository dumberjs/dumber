require('./hide-log');
require('./check-deps.spec');
// require('./package-file-reader/node.spec');
require('./package-file-reader/jsdelivr.spec');
require('./package-reader.spec');
require('./package.spec');
require('./parser.uses-amd-or-requirejs.spec');
require('./parser.uses-common-js.spec');
require('./parser.uses-esm.spec');
require('./transformers/alias.spec');

require('./trace.spec');
require('./bundler.spec');
require('./transformers/esm-to-cjs.spec');
require('./transformers/hack-moment.spec');
require('./transformers/cjs-to-amd.spec');
require('./transformers/conventional-alias.spec.js');
require('./transformers/name-amd-define.spec');
require('./transformers/replace.spec');
require('./transformers/shim-amd.spec');
require('./transformers/text.spec');
require('./transformers/wasm.spec');
require('./transformers/node-env-condition.spec');
require('./transformers/process.spec');
// require('./shared.fs.spec');
require('./shared.spec');
require('./stub-module.spec');
// require('./stub-module-packages.spec');
require('./inject-css.spec');
require('./modules-done.spec');
require('./modules-todo.spec');
require('./transform.spec.js');

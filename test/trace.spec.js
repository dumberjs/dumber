const {test} = require('zora');
const _trace = require('../lib/trace');

function trace(unit, opts) {
  return _trace(unit, opts).then(unit => {
    // don't test source map details
    if (unit.sourceMap) unit.sourceMap.mappings = '';
    return unit;
  });
}

test('trace rejects not-matching packageName and moduleId', async t => {
  const unit = {
    path: 'node_module/foo/bar.js',
    contents: "lorem",
    moduleId: 'x/bar',
    packageName: 'foo',
    packageMainPath: 'index.js'
  };
  return trace(unit).catch(err => {
    t.ok(err);
  })
});

test('trace does not reject moduleId which is same as packageName', async t => {
  const unit = {
    path: '__stub__/fs.js',
    contents: "define(function(){});",
    moduleId: 'fs',
    packageName: 'fs',
    packageMainPath: 'index.js'
  };
  return trace(unit).then(
    traced => {
      t.deepEqual(traced, {
        path: '__stub__/fs.js',
        contents: "define('fs',function(){});",
        moduleId: 'fs',
        defined: ['fs'],
        deps: [],
        packageName: 'fs',
        packageMainPath: 'index.js'
      });
    },
    err => {
      t.fail(err);
    }
  );
});

test('trace traces js', async t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "define(['a','text!./b.css'],function() {});",
    moduleId: 'foo/bar'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['a','text!./b.css'],function() {});",
      moduleId: 'foo/bar',
      defined: ['foo/bar'],
      deps: ['a', 'text!./b.css']
    });
  });
});

test('trace traces js and update sourceMap', async t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "exports.bar = require('./a');",
    sourceMap: {
      version: 3,
      names: [],
      sources: ['foo/bar.js'],
      file: 'foo/bar.js',
      mappings: '',
      sourcesContent: ["exports.bar = require('./a');"]
    },
    moduleId: 'foo/bar'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['require','exports','module','./a'],function (require, exports, module) {\n" +
                "exports.bar = require('./a');\n});\n",
      sourceMap: {
        version: 3,
        names: [],
        sources: ['foo/bar.js'],
        file: 'foo/bar.js',
        mappings: '',
        sourcesContent: ["exports.bar = require('./a');"]
      },
      moduleId: 'foo/bar',
      defined: ['foo/bar'],
      deps: ['./a']
    });
  });
});

test('trace traces shimed js and update sourceMap', async t => {
  const unit = {
    path: 'node_modules/bar/bar.js',
    contents: "var Bar = 1;",
    sourceMap: {
      version: 3,
      names: [],
      sources: ['node_modules/bar/bar.js'],
      file: 'node_modules/bar/bar.js',
      mappings: '',
      sourcesContent: ["var Bar = 1;"]
    },
    moduleId: 'bar/bar',
    packageName: 'bar',
    packageMainPath: 'index.js',
    shim: { deps: ['foo'], 'exports': 'Bar', wrapShim: true}
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/bar/bar.js',
      contents: '(function(root) {\n' +
                'define(\'bar/bar\',[\'foo\'],function() {\n' +
                '  return (function() {\n' +
                'var Bar = 1;;\n' +
                'return root.Bar = Bar;\n' +
                '  }).apply(root, arguments);\n});\n}(this));\n',
      sourceMap: {
        version: 3,
        names: [],
        sources: ['node_modules/bar/bar.js'],
        file: 'node_modules/bar/bar.js',
        mappings: '',
        sourcesContent: ["var Bar = 1;"]
      },
      moduleId: 'bar/bar',
      defined: ['bar/bar'],
      deps: ['foo'],
      packageName: 'bar',
      packageMainPath: 'index.js',
      shim: { deps: ['foo'], 'exports': 'Bar', wrapShim: true},
      shimed: true
    });
  });
});

test('trace forces shim on old js and update sourceMap', async t => {
  const unit = {
    path: 'node_modules/bar/bar.js',
    contents: "var Bar = 1;",
    sourceMap: {
      version: 3,
      names: [],
      sources: ['node_modules/bar/bar.js'],
      file: 'node_modules/bar/bar.js',
      mappings: '',
      sourcesContent: ["var Bar = 1;"]
    },
    moduleId: 'bar/bar',
    packageName: 'bar',
    packageMainPath: 'index.js'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/bar/bar.js',
      contents: 'var Bar = 1;;\n' +
                'define(\'bar/bar\',function(){});\n',
      sourceMap: {
        version: 3,
        names: [],
        sources: ['node_modules/bar/bar.js'],
        file: 'node_modules/bar/bar.js',
        mappings: '',
        sourcesContent: ["var Bar = 1;"]
      },
      moduleId: 'bar/bar',
      defined: ['bar/bar'],
      deps: [],
      packageName: 'bar',
      packageMainPath: 'index.js',
      shimed: true
    });
  });
});

test('trace transforms json', async t => {
  const unit = {
    path: 'src/foo/bar.json',
    contents: '{"a":1}',
    moduleId: 'foo/bar.json'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.json',
      contents: "define('foo/bar.json',function(){return JSON.parse(\"{\\\"a\\\":1}\");});",
      moduleId: 'foo/bar.json',
      defined: ['foo/bar.json'],
      deps: []
    });
  });
});

test('trace transforms text file', async t => {
  const unit = {
    path: 'src/foo/bar.html',
    contents: '<p></p>',
    moduleId: 'foo/bar.html',
    sourceMap: {
      version: 3,
      file: 'src/foo/bar.html',
      sources: [ 'src/foo/bar.html' ],
      mappings: '',
      names: [],
      sourcesContent: [ '<p></p>' ]
    },
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.html',
      contents: "define('text!foo/bar.html',function(){return \"<p></p>\";});",
      sourceMap: {
        version: 3,
        file: 'src/foo/bar.html',
        sources: [ 'src/foo/bar.html' ],
        mappings: '',
        names: [],
        sourcesContent: [ '<p></p>' ]
      },
      moduleId: 'foo/bar.html',
      defined: ['text!foo/bar.html'],
      deps: []
    });
  });
});

test('trace transforms wasm file', async t => {
  const unit = {
    path: 'src/foo/bar.wasm',
    contents: 'abc',
    moduleId: 'foo/bar.wasm'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.wasm',
      contents: "define('raw!foo/bar.wasm',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(\"abc\"));}}});",
      moduleId: 'foo/bar.wasm',
      defined: ['raw!foo/bar.wasm'],
      deps: ['base64-arraybuffer']
    });
  });
});

test('trace supports optional depsFinder returns deps directly', async t => {
  const depsFinder = function (path, contents) {
    if (path.endsWith('.js')) return ['./x'];
    if (path.endsWith('.html')) {
      let m = contents.match(/<require from="(\w+)"><\/require>/i);
      if (m) return [m[1]];
      return [];
    }
    return [];
  };

  return Promise.all([
    trace({
      path: 'src/foo/bar.js',
      contents: 'require("./b");',
      moduleId: 'foo/bar'
    }, {depsFinder}),
    trace({
      path: 'src/foo/bar.html',
      contents: '<require from="lorem"></require>',
      moduleId: 'foo/bar.html'
    }, {depsFinder})
  ])
  .then(result => {
    const [traced1, traced2] = result;
    t.deepEqual(traced1.deps, ['./b', './x']);
    t.deepEqual(traced2.deps, ['lorem']);
  });
});

test('trace supports optional depsFinder returns deps in promise', async t => {
  const depsFinder = function (path, contents) {
    return new Promise(resolve => {
      if (path.endsWith('.js')) return resolve(['./x']);
      if (path.endsWith('.html')) {
        let m = contents.match(/<require from="(\w+)"><\/require>/i);
        if (m) return resolve([m[1]]);
        return resolve([]);
      }
      return resolve([]);
    });
  };

  return Promise.all([
    trace({
      path: 'src/foo/bar.js',
      contents: 'require("./b");',
      moduleId: 'foo/bar'
    }, {depsFinder}),
    trace({
      path: 'src/foo/bar.html',
      contents: '<require from="lorem"></require>',
      moduleId: 'foo/bar.html'
    }, {depsFinder})
  ])
  .then(result => {
    const [traced1, traced2] = result;
    t.deepEqual(traced1.deps, ['./b', './x']);
    t.deepEqual(traced2.deps, ['lorem']);
  });
});

test('trace supports cache', async t => {
  const tracedPath = {};
  const depsFinder = function (path, contents) {
    if (tracedPath[path]) {
      t.fail('should not call depsFinder again on ' + path);
      return;
    }

    tracedPath[path] = true;

    return new Promise(resolve => {
      if (path.endsWith('.js')) return resolve(['./x']);
      if (path.endsWith('.html')) {
        let m = contents.match(/<require from="(\w+)"><\/require>/i);
        if (m) return resolve([m[1]]);
        return resolve([]);
      }
      return resolve([]);
    });
  };

  let cached = {};
  const triedCacheMeta = [];
  const cache = {
    getCache: (hash, meta) => {
      triedCacheMeta.push(meta);
      return cached[hash];
    },
    setCache: (hash, obj) => cached[hash] = obj,
    clearCache: () => cached = {}
  }

  return Promise.all([
    trace({
      path: 'src/foo/bar.js',
      contents: 'require("./b");',
      moduleId: 'foo/bar'
    }, {cache, depsFinder}),
    trace({
      path: 'src/foo/bar.html',
      contents: '<require from="lorem"></require>',
      moduleId: 'foo/bar.html'
    }, {cache, depsFinder})
  ])
  .then(result => {
    const [traced1, traced2] = result;
    t.deepEqual(traced1.deps, ['./b', './x']);
    t.deepEqual(traced2.deps, ['lorem']);

    t.deepEqual(triedCacheMeta, [
      { packageName: undefined, moduleId: 'foo/bar', size: 15 },
      { packageName: undefined, moduleId: 'foo/bar.html', size: 32 },
    ]);

    return Promise.all([
      trace({
        path: 'src/foo/bar.js',
        contents: 'require("./b");',
        moduleId: 'foo/bar'
      }, {cache, depsFinder}),
      trace({
        path: 'src/foo/bar.html',
        contents: '<require from="lorem"></require>',
        moduleId: 'foo/bar.html'
      }, {cache, depsFinder})
    ]);
  })
  .then(result => {
    const [traced1, traced2] = result;
    t.deepEqual(traced1.deps, ['./b', './x']);
    t.deepEqual(traced2.deps, ['lorem']);
  });
});

test('trace traces npm js with dist alias', async t => {
  const unit = {
    path: 'node_modules/foo/dist/bar.js',
    contents: "define(['a','text!./b.css'],function() {});",
    moduleId: 'foo/dist/bar',
    packageName: 'foo',
    packageMainPath: 'dist/index.js',
    sourceMap: {
      version: 3,
      sources: [ 'node_modules/foo/dist/bar.js' ],
      names: [],
      mappings: '',
      file: 'node_modules/foo/dist/bar.js',
      sourcesContent: [ 'define([\'a\',\'text!./b.css\'],function() {});' ]
    },
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/bar.js',
      contents: "define('foo/dist/bar',['a','text!./b.css'],function() {});\n;define.alias('foo/bar','foo/dist/bar');",
      sourceMap: {
        version: 3,
        sources: [ 'node_modules/foo/dist/bar.js' ],
        names: [],
        mappings: '',
        file: 'node_modules/foo/dist/bar.js',
        sourcesContent: [ 'define([\'a\',\'text!./b.css\'],function() {});' ]
      },
      moduleId: 'foo/dist/bar',
      defined: ['foo/dist/bar', 'foo/bar'],
      deps: ['a', 'text!./b.css'],
      packageName: 'foo',
      packageMainPath: 'dist/index.js',
      alias: null
    });
  });
});

test('trace traces npm html with dist alias', async t => {
  const unit = {
    path: 'node_modules/foo/dist/cjs/bar.html',
    contents: "<p></p>",
    moduleId: 'foo/dist/cjs/bar.html',
    packageName: 'foo',
    packageMainPath: 'dist/cjs/index.js'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/cjs/bar.html',
      contents: "define('text!foo/dist/cjs/bar.html',function(){return \"<p></p>\";});\n;define.alias('text!foo/bar.html','text!foo/dist/cjs/bar.html');\n;define.alias('foo/bar.html','foo/dist/cjs/bar.html');",
      moduleId: 'foo/dist/cjs/bar.html',
      defined: ['text!foo/dist/cjs/bar.html', 'text!foo/bar.html', 'foo/bar.html'],
      deps: [],
      packageName: 'foo',
      packageMainPath: 'dist/cjs/index.js',
      alias: null
    });
  });
});

test('trace patches momentjs to expose global var "moment"', async t => {
  const moment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () {})));`;

  const transformedMoment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? (function(){var m=factory();if(typeof moment === 'undefined' && typeof global !== 'undefined'){global.moment=m;} define('moment/moment',function(){return m;})})() :
    global.moment = factory()
}(this, (function () {})));`;

  const unit = {
    path: 'node_modules/moment/moment.js',
    contents: moment,
    moduleId: 'moment/moment',
    packageName: 'moment',
    packageMainPath: 'moment.js'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/moment/moment.js',
      contents: transformedMoment,
      moduleId: 'moment/moment',
      defined: ['moment/moment'],
      deps: [],
      packageName: 'moment',
      packageMainPath: 'moment.js'
    });
  });
});

// FIXME: lib/transformers/process.js now patches more than just NODE_ENV.
//
// test('trace patches npm package process for NODE_ENV', async t => {
//   const processFile = 'var process = module.exports = {};';
//
//   const nodeEnv = process.env.NODE_ENV || '';
//   const patchedProcessFile = `var process = module.exports = {};
// process.env = {"NODE_ENV":${JSON.stringify(nodeEnv)}};
// `;
//
//   const transformedProcessFile = `define('process/browser',['require','exports','module'],function (require, exports, module) {
// ${patchedProcessFile}
// });
//
// ;define.alias('process','process/browser');`;
//
//   const unit = {
//     path: 'node_modules/process/browser.js',
//     contents: processFile,
//     sourceMap: undefined,
//     moduleId: 'process/browser',
//     packageName: 'process',
//     packageMainPath: 'browser.js',
//     alias: 'process',
//   };
//
//   return trace(unit).then(traced => {
//     t.deepEqual(traced, {
//       path: 'node_modules/process/browser.js',
//       contents: transformedProcessFile,
//       moduleId: 'process/browser',
//       defined: ['process/browser', 'process'],
//       deps: [],
//       packageName: 'process',
//       packageMainPath: 'browser.js',
//       alias: null,
//       sourceMap: {
//         version: 3,
//         sources: [ 'node_modules/process/browser.js' ],
//         names: [],
//         mappings: '',
//         file: 'node_modules/process/browser.js',
//         sourcesContent: [ patchedProcessFile ]
//       }
//     });
//   });
// });

test('trace removes conditional NODE_ENV branch', async t => {
  const contents = `if (process.env.NODE_ENV === "production") {
  doIt();
}
exports.foo = 1;
`;

  const expected = `define('foo',['require','exports','module'],function (require, exports, module) {

exports.foo = 1;

});
`;

  const oldNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const unit = {
    path: 'src/foo.js',
    contents: contents,
    moduleId: 'foo',
  };

  return trace(unit).then(
    traced => {
      t.deepEqual(traced, {
        path: 'src/foo.js',
        contents: expected,
        moduleId: 'foo',
        defined: ['foo' ],
        deps: []
      });

      process.env.NODE_ENV = oldNodeEnv;
    },
    err => {
      process.env.NODE_ENV = oldNodeEnv;
      t.fail(err);
    }
  );
});

test('trace traces npm main in cjs', async t => {
  const unit = {
    path: 'node_modules/foo/dist/bar.cjs',
    contents: "define(['a','text!./b.css'],function() {});",
    moduleId: 'foo/dist/bar',
    packageName: 'foo',
    packageMainPath: 'dist/bar.cjs',
    alias: 'foo'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/bar.cjs',
      contents: "define('foo/dist/bar',['a','text!./b.css'],function() {});\n;define.alias('foo','foo/dist/bar');",
      moduleId: 'foo/dist/bar',
      defined: ['foo/dist/bar', 'foo'],
      deps: ['a', 'text!./b.css'],
      packageName: 'foo',
      packageMainPath: 'dist/bar.cjs',
      alias: null
    });
  });
});

test('trace traces npm main in mjs', async t => {
  const unit = {
    path: 'node_modules/foo/dist/bar.mjs',
    contents: "import a from 'a';",
    moduleId: 'foo/dist/bar',
    packageName: 'foo',
    packageMainPath: 'dist/bar.mjs',
    alias: 'foo'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/bar.mjs',
      contents: 'define(\'foo/dist/bar\',[\'require\',\'exports\',\'module\',\'tslib\',\'a\'],function (require, exports, module) {\n"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nconst tslib_1 = require("tslib");\nconst a_1 = tslib_1.__importDefault(require("a"));\n\n});\n\n;define.alias(\'foo\',\'foo/dist/bar\');',
      moduleId: 'foo/dist/bar',
      defined: ['foo/dist/bar', 'foo'],
      deps: ['tslib', 'a'],
      packageName: 'foo',
      packageMainPath: 'dist/bar.mjs',
      alias: null,
      forceWrap: true
    });
  });
});

test('trace bypasses traced unit', async t => {
  const unit = {
    path: 'some/file.s',
    contents: "traced",
    moduleId: 'some/file',
    packageName: 'some',
    packageMainPath: 'file.js',
    defined: ['some/file'],
    deps: []
  };
  return trace(unit).then(
    traced => {
      t.deepEqual(traced, unit);
    },
    err => {
      t.fail(err);
    }
  );
});

test('trace forces commonjs on local empty code', async t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "",
    moduleId: 'foo/bar',
    sourceMap: {
      version: 3,
      sources: [ 'src/foo/bar.js' ],
      names: [],
      mappings: '',
      file: 'src/foo/bar.js',
      sourcesContent: [ "" ]
    },
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['require','exports','module'],function (require, exports, module) {\n\n});\n",
      sourceMap: {
        version: 3,
        sources: [ 'src/foo/bar.js' ],
        names: [],
        mappings: '',
        file: 'src/foo/bar.js',
        sourcesContent: [ "" ]
      },
      moduleId: 'foo/bar',
      defined: ['foo/bar'],
      deps: [],
      forceWrap: true
    });
  });
});

test('trace forces commonjs on local empty code without sourceMap', async t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "",
    moduleId: 'foo/bar'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['require','exports','module'],function (require, exports, module) {\n\n});\n",
      moduleId: 'foo/bar',
      defined: ['foo/bar'],
      deps: [],
      forceWrap: true
    });
  });
});

test('trace forces commonjs on npm empty code', async t => {
  const unit = {
    path: 'node_modules/foo/bar.js',
    contents: "",
    moduleId: 'foo/bar',
    packageName: 'foo',
    packageMainPath: 'bar.js'
  };

  return trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/bar.js',
      contents: "define('foo/bar',['require','exports','module'],function (require, exports, module) {\n\n});\n",
      moduleId: 'foo/bar',
      defined: ['foo/bar'],
      deps: [],
      packageName: 'foo',
      packageMainPath: 'bar.js',
      forceWrap: true
    });
  });
});



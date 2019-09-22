const test = require('tape');
const _trace = require('../lib/trace');

function trace(unit, opts) {
  return _trace(unit, opts).then(unit => {
    // don't test source map details
    unit.sourceMap.mappings = '';
    return unit;
  })
}

test('trace rejects not-matching packageName and moduleId', t => {
  const unit = {
    path: 'node_module/foo/bar.js',
    contents: "lorem",
    moduleId: 'x/bar',
    packageName: 'foo',
    packageMainPath: 'index.js'
  };
  trace(unit).catch(err => {
    t.ok(err);
    t.end();
  })
});

test('trace does not reject moduleId which is same as packageName', t => {
  const unit = {
    path: '__stub__/fs.js',
    contents: "define(function(){});",
    moduleId: 'fs',
    packageName: 'fs',
    packageMainPath: 'index.js'
  };
  trace(unit).then(
    traced => {
      t.deepEqual(traced, {
        path: '__stub__/fs.js',
        contents: "define('fs',function(){});",
        sourceMap: {
          version: 3,
          names: [],
          sources: ['__stub__/fs.js'],
          file: '__stub__/fs.js',
          mappings: '',
          sourcesContent: ['define(function(){});']
        },
        moduleId: 'fs',
        defined: ['fs'],
        deps: [],
        packageName: 'fs',
        packageMainPath: 'index.js'
      });
      t.end();
    },
    err => {
      console.log(err.stack);
      t.fail(err);
      t.end();
    }
  );
});

test('trace traces js', t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "define(['a','text!./b.css'],function() {});",
    moduleId: 'foo/bar'
  };

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['a','text!./b.css'],function() {});",
      sourceMap: {
        version: 3,
        names: [],
        sources: ['src/foo/bar.js'],
        file: 'src/foo/bar.js',
        mappings: '',
        sourcesContent: ["define(['a','text!./b.css'],function() {});"]
      },
      moduleId: 'foo/bar',
      defined: ['foo/bar'],
      deps: ['a', 'text!./b.css']
    });
    t.end();
  });
});

test('trace traces js and update sourceMap', t => {
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

  trace(unit).then(traced => {
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
    t.end();
  });
});

test('trace traces shimed js and update sourceMap', t => {
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

  trace(unit).then(traced => {
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
    t.end();
  });
});

test('trace forces shim on old js and update sourceMap', t => {
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

  trace(unit).then(traced => {
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
    t.end();
  });
});

test('trace transforms json', t => {
  const unit = {
    path: 'src/foo/bar.json',
    contents: '{"a":1}',
    moduleId: 'foo/bar.json'
  };

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.json',
      contents: "define('text!foo/bar.json',function(){return \"{\\\"a\\\":1}\";});define('foo/bar.json',['text!foo/bar.json'],function(m){return JSON.parse(m);});",
      sourceMap: {
        version: 3,
        file: 'src/foo/bar.json',
        sources: [ 'src/foo/bar.json' ],
        mappings: '',
        names: [],
        sourcesContent: [ '{"a":1}' ]
      },
      moduleId: 'foo/bar.json',
      defined: ['foo/bar.json', 'text!foo/bar.json'],
      deps: []
    });
    t.end();
  });
});

test('trace transforms text file', t => {
  const unit = {
    path: 'src/foo/bar.html',
    contents: '<p></p>',
    moduleId: 'foo/bar.html'
  };

  trace(unit).then(traced => {
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
    t.end();
  });
});

test('trace transforms wasm file', t => {
  const unit = {
    path: 'src/foo/bar.wasm',
    contents: 'abc',
    moduleId: 'foo/bar.wasm'
  };

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.wasm',
      contents: "define('raw!foo/bar.wasm',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(\"abc\"));}}});",
      sourceMap: {
        version: 3,
        file: 'src/foo/bar.wasm',
        sources: [ 'src/foo/bar.wasm' ],
        mappings: '',
        names: [],
        sourcesContent: [ 'abc' ]
      },
      moduleId: 'foo/bar.wasm',
      defined: ['raw!foo/bar.wasm'],
      deps: ['base64-arraybuffer']
    });
    t.end();
  });
});

test('trace supports optional depsFinder returns deps directly', t => {
  const depsFinder = function (path, contents) {
    if (path.endsWith('.js')) return ['./x'];
    if (path.endsWith('.html')) {
      let m = contents.match(/<require from="(\w+)"><\/require>/i);
      if (m) return [m[1]];
      return [];
    }
    return [];
  };

  Promise.all([
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
    t.end();
  });
});

test('trace supports optional depsFinder returns deps in promise', t => {
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

  Promise.all([
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
    t.end();
  });
});

test('trace supports cache', t => {
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
  const cache = {
    getCache: hash => cached[hash],
    setCache: (hash, obj) => cached[hash] = obj,
    clearCache: () => cached = {}
  }

  Promise.all([
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
    t.end();
  });
});

test('trace traces npm js with dist alias', t => {
  const unit = {
    path: 'node_modules/foo/dist/bar.js',
    contents: "define(['a','text!./b.css'],function() {});",
    moduleId: 'foo/dist/bar',
    packageName: 'foo',
    packageMainPath: 'dist/index.js'
  };

  trace(unit).then(traced => {
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
    t.end();
  });
});

test('trace traces npm html with dist alias', t => {
  const unit = {
    path: 'node_modules/foo/dist/cjs/bar.html',
    contents: "<p></p>",
    moduleId: 'foo/dist/cjs/bar.html',
    packageName: 'foo',
    packageMainPath: 'dist/cjs/index.js'
  };

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/cjs/bar.html',
      contents: "define('text!foo/dist/cjs/bar.html',function(){return \"<p></p>\";});\n;define.alias('text!foo/bar.html','text!foo/dist/cjs/bar.html');",
      sourceMap: {
        version: 3,
        sources: [ 'node_modules/foo/dist/cjs/bar.html' ],
        names: [],
        mappings: '',
        file: 'node_modules/foo/dist/cjs/bar.html',
        sourcesContent: [ '<p></p>' ]
      },
      moduleId: 'foo/dist/cjs/bar.html',
      defined: ['text!foo/dist/cjs/bar.html', 'text!foo/bar.html'],
      deps: [],
      packageName: 'foo',
      packageMainPath: 'dist/cjs/index.js',
      alias: null
    });
    t.end();
  });
});

test('trace patches momentjs to expose global var "moment"', t => {
  const moment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () {})));`;

  const transformedMoment = `//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? (function(){var m=factory();if(typeof moment === 'undefined'){window.moment=m;} define('moment/moment',function(){return m;})})() :
    global.moment = factory()
}(this, (function () {})));`;

  const unit = {
    path: 'node_modules/moment/moment.js',
    contents: moment,
    sourceMap: undefined,
    moduleId: 'moment/moment',
    packageName: 'moment',
    packageMainPath: 'moment.js'
  };

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/moment/moment.js',
      contents: transformedMoment,
      moduleId: 'moment/moment',
      defined: ['moment/moment'],
      deps: [],
      packageName: 'moment',
      packageMainPath: 'moment.js',
      sourceMap: {
        version: 3,
        sources: [ 'node_modules/moment/moment.js' ],
        names: [],
        mappings: '',
        file: 'node_modules/moment/moment.js',
        sourcesContent: [ '//! moment.js\n\n;(function (global, factory) {\n    typeof exports === \'object\' && typeof module !== \'undefined\' ? module.exports = factory() :\n    typeof define === \'function\' && define.amd ? (function(){var m=factory();if(typeof moment === \'undefined\'){window.moment=m;} define(function(){return m;})})() :\n    global.moment = factory()\n}(this, (function () {})));' ]
      }
    });
    t.end();
  });
});

test('trace patches npm package process for NODE_ENV', t => {
  const processFile = 'var process = module.exports = {};';

  const nodeEnv = process.env.NODE_ENV || '';
  const patchedProcessFile = `var process = module.exports = {};
process.env = {"NODE_ENV":${JSON.stringify(nodeEnv)}};
`;

  const transformedProcessFile = `define('process/browser',['require','exports','module'],function (require, exports, module) {
${patchedProcessFile}
});

;define.alias('process','process/browser');`;

  const unit = {
    path: 'node_modules/process/browser.js',
    contents: processFile,
    sourceMap: undefined,
    moduleId: 'process/browser',
    packageName: 'process',
    packageMainPath: 'browser.js',
    alias: 'process',
  };

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/process/browser.js',
      contents: transformedProcessFile,
      moduleId: 'process/browser',
      defined: ['process/browser', 'process'],
      deps: [],
      packageName: 'process',
      packageMainPath: 'browser.js',
      alias: null,
      sourceMap: {
        version: 3,
        sources: [ 'node_modules/process/browser.js' ],
        names: [],
        mappings: '',
        file: 'node_modules/process/browser.js',
        sourcesContent: [ patchedProcessFile ]
      }
    });
    t.end();
  });
});

test('trace removes conditional NODE_ENV branch', t => {
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
    sourceMap: undefined,
    moduleId: 'foo',
  };

  trace(unit).then(
    traced => {
      t.deepEqual(traced, {
        path: 'src/foo.js',
        contents: expected,
        moduleId: 'foo',
        defined: ['foo' ],
        deps: [],
        sourceMap: {
          version: 3,
          sources: [ 'src/foo.js' ],
          names: [],
          mappings: '',
          file: 'src/foo.js',
          sourcesContent: [ contents ]
        }
      });

      process.env.NODE_ENV = oldNodeEnv;
      t.end();
    },
    err => {
      process.env.NODE_ENV = oldNodeEnv;
      t.fail(err);
      t.end();
    }
  );
});

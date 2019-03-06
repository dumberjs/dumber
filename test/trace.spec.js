import test from 'tape';
import trace from '../src/trace';

test('trace rejects not-matching packageName and moduleId', t => {
  const unit = {
    path: 'node_module/foo/bar.js',
    contents: "lorem",
    moduleId: 'x/bar',
    packageName: 'foo'
  }
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
    packageName: 'fs'
  }
  trace(unit).then(
    traced => {
      t.deepEqual(traced, {
        path: '__stub__/fs.js',
        contents: "define('fs',function(){});",
        sourceMap: undefined,
        moduleId: 'fs',
        defined: 'fs',
        deps: [],
        packageName: 'fs',
        shimed: undefined
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
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['a','text!./b.css'],function() {});",
      sourceMap: undefined,
      moduleId: 'foo/bar',
      defined: 'foo/bar',
      deps: ['a', 'text!./b.css'],
      packageName: undefined,
      shimed: undefined
    })
    t.end();
  });
});

test('trace traces js and update sourceMap', t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "exports.bar = require('./a');",
    sourceMap: {mappings: ";TEST;"},
    moduleId: 'foo/bar'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.js',
      contents: "define('foo/bar',['require','exports','module','./a'],function (require, exports, module) {\n" +
                "exports.bar = require('./a');\n});\n",
      sourceMap: {mappings: ";;TEST;"},
      moduleId: 'foo/bar',
      defined: 'foo/bar',
      deps: ['./a'],
      packageName: undefined,
      shimed: undefined
    })
    t.end();
  });
});

test('trace traces shimed js and update sourceMap', t => {
  const unit = {
    path: 'node_modules/bar/bar.js',
    contents: "var Bar = 1;",
    sourceMap: {mappings: ";TEST;"},
    moduleId: 'bar/bar',
    packageName: 'bar',
    shim: { deps: ['foo'], 'exports': 'Bar', wrapShim: true}
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/bar/bar.js',
      contents: '(function(root) {\n' +
                'define("bar/bar", [\'foo\'], function() {\n' +
                '  return (function() {\n' +
                'var Bar = 1;;\n' +
                'return root.Bar = Bar;\n' +
                '  }).apply(root, arguments);\n});\n}(this));\n',
      sourceMap: {mappings: ";;;;TEST;"},
      moduleId: 'bar/bar',
      defined: 'bar/bar',
      deps: ['foo'],
      packageName: 'bar',
      shimed: true
    })
    t.end();
  });
});

test('trace forces shim on old js and update sourceMap', t => {
  const unit = {
    path: 'node_modules/bar/bar.js',
    contents: "var Bar = 1;",
    sourceMap: {mappings: ";TEST;"},
    moduleId: 'bar/bar',
    packageName: 'bar'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/bar/bar.js',
      contents: 'var Bar = 1;;\n' +
                'define("bar/bar", function(){});\n',
      sourceMap: {mappings: ";TEST;"},
      moduleId: 'bar/bar',
      defined: 'bar/bar',
      deps: [],
      packageName: 'bar',
      shimed: true
    })
    t.end();
  });
});

test('trace transforms json', t => {
  const unit = {
    path: 'src/foo/bar.json',
    contents: '{"a":1}',
    moduleId: 'foo/bar.json'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.json',
      contents: "define('text!foo/bar.json',function(){return \"{\\\"a\\\":1}\";});",
      sourceMap: undefined,
      moduleId: 'foo/bar.json',
      defined: 'text!foo/bar.json',
      deps: [],
      packageName: undefined,
      shimed: undefined
    })
    t.end();
  });
});

test('trace transforms text file', t => {
  const unit = {
    path: 'src/foo/bar.html',
    contents: '<p></p>',
    moduleId: 'foo/bar.html'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.html',
      contents: "define('text!foo/bar.html',function(){return \"<p></p>\";});",
      sourceMap: undefined,
      moduleId: 'foo/bar.html',
      defined: 'text!foo/bar.html',
      deps: [],
      packageName: undefined,
      shimed: undefined
    })
    t.end();
  });
});

test('trace transforms wasm file', t => {
  const unit = {
    path: 'src/foo/bar.wasm',
    contents: 'abc',
    moduleId: 'foo/bar.wasm'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'src/foo/bar.wasm',
      contents: "define('raw!foo/bar.wasm',['base64-arraybuffer'],function(a){return {arrayBuffer: function() {return Promise.resolve(a.decode(\"abc\"));}}});",
      sourceMap: undefined,
      moduleId: 'foo/bar.wasm',
      defined: 'raw!foo/bar.wasm',
      deps: ['base64-arraybuffer'],
      packageName: undefined,
      shimed: undefined
    })
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
  }

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
  }

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
  }

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
    packageName: 'foo'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/bar.js',
      contents: "define('foo/dist/bar',['a','text!./b.css'],function() {});define('foo/bar',['foo/dist/bar'],function(m){return m;});",
      sourceMap: undefined,
      moduleId: 'foo/dist/bar',
      defined: ['foo/dist/bar', 'foo/bar'],
      deps: ['a', 'text!./b.css'],
      packageName: 'foo',
      shimed: undefined
    })
    t.end();
  });
});

test('trace traces npm html with dist alias', t => {
  const unit = {
    path: 'node_modules/foo/dist/cjs/bar.html',
    contents: "<p></p>",
    moduleId: 'foo/dist/cjs/bar.html',
    packageName: 'foo'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/foo/dist/cjs/bar.html',
      contents: "define('text!foo/dist/cjs/bar.html',function(){return \"<p></p>\";});define('text!foo/bar.html',['text!foo/dist/cjs/bar.html'],function(m){return m;});",
      sourceMap: undefined,
      moduleId: 'foo/dist/cjs/bar.html',
      defined: ['text!foo/dist/cjs/bar.html', 'text!foo/bar.html'],
      deps: [],
      packageName: 'foo',
      shimed: undefined
    })
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
    packageName: 'moment'
  }

  trace(unit).then(traced => {
    t.deepEqual(traced, {
      path: 'node_modules/moment/moment.js',
      contents: transformedMoment,
      sourceMap: undefined,
      moduleId: 'moment/moment',
      defined: 'moment/moment',
      deps: [],
      packageName: 'moment',
      shimed: undefined
    })
    t.end();
  });
});
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
      deps: ['a', 'text!foo/b.css'],
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
      deps: ['foo/a'],
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
                'var Bar = 1;\n' +
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
      contents: 'var Bar = 1;\n' +
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
      contents: "define('text!foo/bar.json',function(){return \"{\\\"a\\\":1}\";});\n",
      sourceMap: undefined,
      moduleId: 'foo/bar.json',
      defined: ['text!foo/bar.json'],
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
      contents: "define('text!foo/bar.html',function(){return \"<p></p>\";});\n",
      sourceMap: undefined,
      moduleId: 'foo/bar.html',
      defined: ['text!foo/bar.html'],
      deps: [],
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
    }, depsFinder),
    trace({
      path: 'src/foo/bar.html',
      contents: '<require from="lorem"></require>',
      moduleId: 'foo/bar.html'
    }, depsFinder)
  ])
  .then(result => {
    const [traced1, traced2] = result;
    t.deepEqual(traced1.deps, ['foo/b', 'foo/x']);
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
    }, depsFinder),
    trace({
      path: 'src/foo/bar.html',
      contents: '<require from="lorem"></require>',
      moduleId: 'foo/bar.html'
    }, depsFinder)
  ])
  .then(result => {
    const [traced1, traced2] = result;
    t.deepEqual(traced1.deps, ['foo/b', 'foo/x']);
    t.deepEqual(traced2.deps, ['lorem']);
    t.end();
  });
});

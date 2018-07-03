import test from 'tape';
import defines from '../../src/transformers/defines';

// copied from r.js/build/tests/buildUtils.js
// for toTransport

test('defines ignores non-global define', t => {
  const bad1 = 'this.define(field, value, {_resolve: false});';
  const r = defines('bad/1', bad1);
  t.equal(r.defined, null);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, bad1);
  t.end();
});

test('defines ignores xdefine', t => {
  const bad2 = 'xdefine(fields, callback);';
  const r = defines('bad/2', bad2);
  t.equal(r.defined, null);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, bad2);
  t.end();
});

test('defines ignores non-global define case2', t => {
  const bad3 = 'this.define(function () {});';
  const r = defines('bad/3', bad3);
  t.equal(r.defined, null);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, bad3);
  t.end();
});

test('defines ignores dynamic deps', t => {
  const bad4 = 'define(fields, callback);';
  const r = defines('bad/4', bad4);
  t.equal(r.defined, null);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, bad4);
  t.end();
});

test('defines ignores dynamic name or factory', t => {
  const bad5 = 'define(a[0]);';
  const r = defines('bad/5', bad5);
  t.equal(r.defined, null);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, bad5);
  t.end();
});

test('defines ignores multiple defines', t => {
  const bad6 =  '(function () {\n' +
                '    (function () {\n' +
                '        var module = { exports: {} }, exports = module.exports;\n' +
                '        (function (name, context, definition) {\n' +
                '            if (typeof module != \'undefined\' && module.exports) module.exports = definition()\n' +
                '            else if (typeof define == \'function\' && define.amd) define(definition)\n' +
                '            else context[name] = definition()\n' +
                '        })(\'qwery\', this, function () {\n' +
                '        });\n' +
                '    }());\n' +
                '    (function () {\n' +
                '        var module = { exports: {} }, exports = module.exports;\n' +
                '        (function (name, context, definition) {\n' +
                '            if (typeof module != \'undefined\' && module.exports) module.exports = definition()\n' +
                '            else if (typeof define == \'function\' && define.amd) define(definition)\n' +
                '            else context[name] = definition()\n' +
                '        })(\'bonzo\', this, function () {\n' +
                '        });\n' +
                '    }());\n' +
                '}());';

  const r = defines('bad/6', bad6);
  t.equal(r.defined, null);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, bad6);
  t.end();
});

test('defines fills up module name', t => {
  const good1 = 'if (typeof define === "function" && define.amd) {\n' +
                '    define(definition);\n' +
                '}';

  const goodExpected1 = 'if (typeof define === "function" && define.amd) {\n' +
                        '    define(\'good/1\',definition);\n' +
                        '}';
  const r = defines('good/1', good1);
  t.equal(r.defined, 'good/1');
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, goodExpected1);
  t.end();
});

test('defines fills up module name', t => {
  const good2 = '//    define([\'bad\'], function () {});\n' +
                'define([\'foo\'], function () {});';

  const goodExpected2 = '//    define([\'bad\'], function () {});\n' +
                        'define(\'good/2\',[\'foo\'], function () {});';

  const r = defines('good/2', good2);
  t.equal(r.defined, 'good/2');
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['foo']);
  t.equal(r.contents, goodExpected2);
  t.end();
});

test('defines ignores multiple defines case 2', t => {
  const multi = 'define("foo", function (require) { var bar = require("bar"); });\n' +
                'define("bar", function (require) { var foo = require("foo"); });\n';
  const r = defines('multi', multi);
  t.deepEqual(r.defined, ['foo', 'bar']);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, multi);
  t.end();
});

test('defines wrapps multi anonymous define', t => {
  const multiAnonWrapped =  '(function (root, factory) {\n' +
                            '    if (typeof define === \'function\' && define.amd) {\n' +
                            '        define([\'b\'], factory);\n' +
                            '    } else {\n' +
                            '        // Browser globals\n' +
                            '        root.amdWeb = factory(root.b);\n' +
                            '    }\n' +
                            '}(this, function (b) {\n' +
                            '    var stored = {};\n' +
                            '    function define(id, func) { stored[id] = func();}\n' +
                            '    define("foo", function (require) { var bar = require("bar"); });\n' +
                            '    define("bar", function (require) { var foo = require("foo"); });\n' +
                            '    return stored.bar;\n' +
                            '}));';

  const multiAnonWrappedExpected =  '(function (root, factory) {\n' +
                                    '    if (typeof define === \'function\' && define.amd) {\n' +
                                    '        define(\'multiAnonWrapped\',[\'b\'], factory);\n' +
                                    '    } else {\n' +
                                    '        // Browser globals\n' +
                                    '        root.amdWeb = factory(root.b);\n' +
                                    '    }\n' +
                                    '}(this, function (b) {\n' +
                                    '    var stored = {};\n' +
                                    '    function define(id, func) { stored[id] = func();}\n' +
                                    '    define("foo", function (require) { var bar = require("bar"); });\n' +
                                    '    define("bar", function (require) { var foo = require("foo"); });\n' +
                                    '    return stored.bar;\n' +
                                    '}));';

  const r = defines('multiAnonWrapped', multiAnonWrapped);
  t.equal(r.defined, 'multiAnonWrapped');
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['b']);
  t.equal(r.contents, multiAnonWrappedExpected);
  t.end();
});

test('defines inserts correctly for define across multiple lines', t => {
  const good3 = 'define(\n' +
                '    // a comment\n' +
                '    [\n' +
                '        "some/dep"\n' +
                '    ],\nfunction (dep) {});';

  const goodExpected3 = 'define(\n' +
                        '    // a comment\n' +
                        '    \'good/3\',[\n' +
                        '        "some/dep"\n' +
                        '    ],\nfunction (dep) {});';

  const r = defines('good/3', good3);
  t.equal(r.defined, 'good/3');
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['some/dep']);
  t.equal(r.contents, goodExpected3);
  t.end();
});

test('defines inserts correctly for factory define', t => {
  const good4 = 'define(this.key)';
  const goodExpected4 = 'define(\'good/4\',this.key)';
  const r = defines('good/4', good4);
  t.equal(r.defined, 'good/4');
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, goodExpected4);
  t.end();
});

// modified test. we don't do namespace.
test('defines inserts correctly for cjs wrapper define', t => {
  const good5 = 'if ("function" === typeof define && define.amd) {\n' +
                '    define(function (require) {\n' +
                '        return {\n' +
                '            name: "five",\n' +
                '            six: require("./six")\n' +
                '        };\n' +
                '    });\n' +
                '}';
  const goodExpected5 = 'if ("function" === typeof define && define.amd) {\n' +
                        '    define(\'good/5\',[\'require\',\'./six\'],function (require) {\n' +
                        '        return {\n' +
                        '            name: "five",\n' +
                        '            six: require("./six")\n' +
                        '        };\n' +
                        '    });\n' +
                        '}';
  const r = defines('good/5', good5);
  t.equal(r.defined, 'good/5');
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./six']);
  t.equal(r.contents, goodExpected5);
  t.end();
});

test('defines inserts correctly for cjs wrapper define case 2', t => {
  const good5 = 'if ("function" === typeof define && define.amd) {\n' +
                '    define(function (require, exports) {\n' +
                '        return {\n' +
                '            name: "five",\n' +
                '            six: require("./six")\n' +
                '        };\n' +
                '    });\n' +
                '}';
  const goodExpected5 = 'if ("function" === typeof define && define.amd) {\n' +
                        '    define(\'good/5\',[\'require\',\'exports\',\'./six\'],function (require, exports) {\n' +
                        '        return {\n' +
                        '            name: "five",\n' +
                        '            six: require("./six")\n' +
                        '        };\n' +
                        '    });\n' +
                        '}';
  const r = defines('good/5', good5);
  t.equal(r.defined, 'good/5');
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./six']);
  t.equal(r.contents, goodExpected5);
  t.end();
});

test('defines inserts correctly for cjs wrapper define case 3', t => {
  const good5 = 'if ("function" === typeof define && define.amd) {\n' +
                '    define(function (require, exports, module) {\n' +
                '        return {\n' +
                '            name: "five",\n' +
                '            six: require("./six")\n' +
                '        };\n' +
                '    });\n' +
                '}';
  const goodExpected5 = 'if ("function" === typeof define && define.amd) {\n' +
                        '    define(\'good/5\',[\'require\',\'exports\',\'module\',\'./six\'],function (require, exports, module) {\n' +
                        '        return {\n' +
                        '            name: "five",\n' +
                        '            six: require("./six")\n' +
                        '        };\n' +
                        '    });\n' +
                        '}';
  const r = defines('good/5', good5);
  t.equal(r.defined, 'good/5');
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./six']);
  t.equal(r.contents, goodExpected5);
  t.end();
});

test('defines shim', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";\n' +
                       'define("shim", [\'bar\'], (function (global) {\n' +
                       '  return function () {\n' +
                       '    return global.Foo;\n' +
                       '  };\n' +
                       '}(this)));\n';
  const r = defines('shim', shim, {deps: ['bar'], 'exports': 'Foo'});
  t.equal(r.defined, 'shim');
  t.ok(r.shimed);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.end();
});

test('defines shim without deps', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";\n' +
                       'define("shim", (function (global) {\n' +
                       '  return function () {\n' +
                       '    return global.Foo;\n' +
                       '  };\n' +
                       '}(this)));\n';
  const r = defines('shim', shim, {'exports': 'Foo'});
  t.equal(r.defined, 'shim');
  t.ok(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, shimExpected);
  t.end();
});

test('defines shim without exports', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";\n' +
                       'define("shim", [\'bar\'], function(){});\n';
  const r = defines('shim', shim, {deps: ['bar']});
  t.equal(r.defined, 'shim');
  t.ok(r.shimed);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.end();
});

test('defines wrapShim', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = '(function(root) {\n' +
                       'define("shim", [\'bar\'], function() {\n' +
                       '  return (function() {\n' +
                       'var Foo = "Foo";\n' +
                       'return root.Foo = Foo;\n' +
                       '  }).apply(root, arguments);\n' +
                       '});\n' +
                       '}(this));\n';
  const r = defines('shim', shim, {deps: ['bar'], 'exports': 'Foo', wrapShim: true});
  t.equal(r.defined, 'shim');
  t.ok(r.shimed);
  t.equal(r.headLines, 3);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.end();
});

test('defines wrapShim without deps', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = '(function(root) {\n' +
                       'define("shim", function() {\n' +
                       '  return (function() {\n' +
                       'var Foo = "Foo";\n' +
                       'return root.Foo = Foo;\n' +
                       '  }).apply(root, arguments);\n' +
                       '});\n' +
                       '}(this));\n';
  const r = defines('shim', shim, {'exports': 'Foo', wrapShim: true});
  t.equal(r.defined, 'shim');
  t.ok(r.shimed);
  t.equal(r.headLines, 3);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, shimExpected);
  t.end();
});

test('defines wrapShim without exports', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = '(function(root) {\n' +
                       'define("shim", [\'bar\'], function() {\n' +
                       '  return (function() {\n' +
                       'var Foo = "Foo";\n' +
                       '\n' +
                       '  }).apply(root, arguments);\n' +
                       '});\n' +
                       '}(this));\n';
  const r = defines('shim', shim, {deps: ['bar'], wrapShim: true});
  t.equal(r.defined, 'shim');
  t.ok(r.shimed);
  t.equal(r.headLines, 3);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.end();
});

test('defines ignores shim settings if source code already defined amd module', t => {
  const good1 = 'if (typeof define === "function" && define.amd) {\n' +
                '    define(definition);\n' +
                '}';

  const goodExpected1 = 'if (typeof define === "function" && define.amd) {\n' +
                        '    define(\'good/1\',definition);\n' +
                        '}';
  const r = defines('good/1', good1, {deps: ['bar'], 'exports': 'Foo', wrapShim: true});
  t.equal(r.defined, 'good/1');
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, goodExpected1);
  t.end();
});

test('defines get requirejs deps', t => {
  t.deepEqual(
    defines('demo', 'require(["a", "./b"]);'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'require(["a", "./b"]);'
    }
  );

  t.deepEqual(
    defines('demo', 'require(["a", "./b"], function(){});'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'require(["a", "./b"], function(){});'
    }
  );

  t.deepEqual(
    defines('demo', 'require({}, ["a", "./b"]);'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'require({}, ["a", "./b"]);'
    }
  );

  t.deepEqual(
    defines('demo', 'require({}, ["a", "./b"], function(){});'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'require({}, ["a", "./b"], function(){});'
    }
  );

  t.deepEqual(
    defines('demo', 'requirejs(["a", "./b"]);'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'requirejs(["a", "./b"]);'
    }
  );

  t.deepEqual(
    defines('demo', 'requirejs(["a", "./b"], function(){});'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'requirejs(["a", "./b"], function(){});'
    }
  );

  t.deepEqual(
    defines('demo', 'requirejs({}, ["a", "./b"]);'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'requirejs({}, ["a", "./b"]);'
    }
  );

  t.deepEqual(
    defines('demo', 'requirejs({}, ["a", "./b"], function(){});'),
    {
      defined: null,
      deps: ['a', './b'],
      contents: 'requirejs({}, ["a", "./b"], function(){});'
    }
  );
  t.end();
});

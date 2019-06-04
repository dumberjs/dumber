import test from 'tape';
import nameDefine from '../../src/transformers/name-amd-define';

// copied from r.js/build/tests/buildUtils.js
// for toTransport

test('nameDefine ignores non-global define', t => {
  const unit = {
    contents: 'this.define(field, value, {_resolve: false});',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  })
  t.end();
});

test('nameDefine ignores xdefine', t => {
  const unit = {
    contents: 'xdefine(fields, callback);',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  })
  t.end();
});

test('nameDefine ignores non-global define case2', t => {
  const unit = {
    contents: 'this.define(function () {});',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  })
  t.end();
});

test('nameDefine ignores dynamic deps', t => {
  const unit = {
    contents: 'define(fields, callback);',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  })
  t.end();
});

test('nameDefine ignores dynamic name or factory', t => {
  const unit = {
    contents: 'define(a[0]);',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  })
  t.end();
});

test('nameDefine ignores multiple nameDefine', t => {
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

  const unit = {
    contents: bad6,
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  })
  t.end();
});

test('nameDefine fills up module name', t => {
  const good1 = 'if (typeof define === "function" && define.amd) {\n' +
                '    define(definition);\n' +
                '}';

  const goodExpected1 = 'if (typeof define === "function" && define.amd) {\n' +
                        '    define(\'good/1\',definition);\n' +
                        '}';

  const unit = {
    contents: good1,
    moduleId: 'good/1',
    path: 'src/good/1.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/1']);
  t.notOk(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, goodExpected1);
  t.equal(r.sourceMap.file, 'src/good/1.js');
  t.deepEqual(r.sourceMap.sources, ['src/good/1.js']);
  t.end();
});

test('nameDefine fills up module name', t => {
  const good2 = '//    define([\'bad\'], function () {});\n' +
                'define([\'foo\'], function () {});';

  const goodExpected2 = '//    define([\'bad\'], function () {});\n' +
                        'define(\'good/2\',[\'foo\'], function () {});';

  const unit = {
    contents: good2,
    moduleId: 'good/2',
    path: 'src/good/2.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/2']);
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['foo']);
  t.equal(r.contents, goodExpected2);
  t.end();
});

test('nameDefine ignores multiple nameDefine case 2', t => {
  const multi = 'define("foo", function (require) { var bar = require("bar"); });\n' +
                'define("bar", function (require) { var foo = require("foo"); });\n';
  const unit = {
    contents: multi,
    moduleId: 'multi',
    path: 'src/multi.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: ['foo', 'bar'],
    deps: []
  });
  t.end();
});

test('nameDefine ignores multiple nameDefine case 3', t => {
  const multi = 'define("foo", ["a"], function (require) { var bar = require("bar"); });\n' +
                'define("bar", ["b", "c"], function (require) { var foo = require("foo"); });\n';
  const unit = {
    contents: multi,
    moduleId: 'multi',
    path: 'src/multi.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: ['foo', 'bar'],
    deps: ['a', 'b', 'c']
  });
  t.end();
});

test('nameDefine ignores inner deps', t => {
  const multi = 'define("foo", function() {});\n' +
                'define("bar", ["foo", "loo"], function (require) { var foo = require("foo"); });\n';
  const unit = {
    contents: multi,
    moduleId: 'multi',
    path: 'src/multi.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: ['foo', 'bar'],
    deps: ['loo']
  });
  t.end();
});

test('nameDefine ignores empty define call', t => {
  const unit = {
    contents: 'define();\n',
    moduleId: 'empty',
    path: 'src/empty.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {defined: [], deps: []});
  t.end();
});

test('nameDefine does not rewrite named define', t => {
  const unit = {
    contents: 'define("foo", function(){});\n',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: ['foo'],
    deps: []
  });
  t.end();
});

test('nameDefine ignore  define call without implementation', t => {
  const unit = {
    contents: 'define(["a"]);\n',
    moduleId: 'foo',
    path: 'src/foo.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r, {
    defined: [],
    deps: []
  });
  t.end();
});

test('nameDefine wraps multi anonymous define', t => {
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

  const unit = {
    contents: multiAnonWrapped,
    moduleId: 'multiAnonWrapped',
    path: 'src/multiAnonWrapped.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['multiAnonWrapped']);
  t.deepEqual(r.deps, ['b']);
  t.deepEqual(r.contents, multiAnonWrappedExpected);
  t.equal(r.sourceMap.file, 'src/multiAnonWrapped.js');
  t.end();
});

test('nameDefine inserts correctly for define across multiple lines', t => {
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

  const unit = {
    contents: good3,
    moduleId: 'good/3',
    path: 'src/good/3.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/3']);
  t.deepEqual(r.deps, ['some/dep']);
  t.deepEqual(r.contents, goodExpected3);
  t.equal(r.sourceMap.file, 'src/good/3.js');
  t.end();
});

test('nameDefine inserts correctly for factory define', t => {
  const good4 = 'define(this.key)';
  const goodExpected4 = 'define(\'good/4\',this.key)';
  const unit = {
    contents: good4,
    moduleId: 'good/4',
    path: 'src/good/4.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/4']);
  t.deepEqual(r.deps, []);
  t.deepEqual(r.contents, goodExpected4);
  t.equal(r.sourceMap.file, 'src/good/4.js');
  t.end();
});

// modified test. we don't do namespace.
test('nameDefine inserts correctly for cjs wrapper define', t => {
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
  const unit = {
    contents: good5,
    moduleId: 'good/5',
    path: 'src/good/5.js',
    sourceMap: {
      version: 3,
      file: 'good/5.js',
      sources: ['good/5.ts'],
      mappings: ''
    }
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/5']);
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./six']);
  t.equal(r.contents, goodExpected5);
  t.equal(r.sourceMap.file, 'good/5.js');
  t.deepEqual(r.sourceMap.sources, ['good/5.js']);
  t.end();
});

test('nameDefine inserts correctly for cjs wrapper define case 2', t => {
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
  const unit = {
    contents: good5,
    moduleId: 'good/5',
    path: 'src/good/5.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/5']);
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./six']);
  t.equal(r.contents, goodExpected5);
  t.end();
});

test('nameDefine inserts correctly for cjs wrapper define case 3', t => {
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
  const unit = {
    contents: good5,
    moduleId: 'good/5',
    path: 'src/good/5.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/5']);
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./six']);
  t.equal(r.contents, goodExpected5);
  t.end();
});

test('nameDefine inserts correctly for cjs wrapper define case 4, keep deps order', t => {
  const good5 = 'if ("function" === typeof define && define.amd) {\n' +
                '    define(function (require, exports, module) {\n' +
                '        return {\n' +
                '            name: "five",\n' +
                '            c: require("./c"),\n' +
                '            a: require("./a"),\n' +
                '            b: require("./b")\n' +
                '        };\n' +
                '    });\n' +
                '}';
  const goodExpected5 = 'if ("function" === typeof define && define.amd) {\n' +
                        '    define(\'good/5\',[\'require\',\'exports\',\'module\',\'./c\',\'./a\',\'./b\'],function (require, exports, module) {\n' +
                        '        return {\n' +
                        '            name: "five",\n' +
                        '            c: require("./c"),\n' +
                        '            a: require("./a"),\n' +
                        '            b: require("./b")\n' +
                        '        };\n' +
                        '    });\n' +
                        '}';
  const unit = {
    contents: good5,
    moduleId: 'good/5',
    path: 'src/good/5.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['good/5']);
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./c', './a', './b']);
  t.equal(r.contents, goodExpected5);
  t.end();
});

test('nameDefine get requirejs deps', t => {
  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'require(["a", "./b"]);'
    }),
    {
      defined: [],
      deps: ['a', './b'],
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'require(["a", "./b"], function(){});'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'require({}, ["a", "./b"]);'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'require({}, ["a", "./b"], function(){});'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'requirejs(["a", "./b"]);'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'requirejs(["a", "./b"], function(){});'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'requirejs({}, ["a", "./b"]);'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );

  t.deepEqual(
    nameDefine({
      moduleId: 'demo',
      path: 'src/demo.js',
      contents: 'requirejs({}, ["a", "./b"], function(){});'
    }),
    {
      defined: [],
      deps: ['a', './b']
    }
  );
  t.end();
});

test('nameDefine fills up module name', t => {
  const cjs = "define(['require','exports','module','./a'],function(require, exports, module){var imp0r_ = function(d){return requirejs([requirejs.resolveModuleId(module.id,d)]).then(function(r){return r[0]&&r[0].default?r[0].default:r;});}; imp0r_('hello');});";
  const cjsExpected = "define('cjs',['require','exports','module','./a'],function(require, exports, module){var imp0r_ = function(d){return requirejs([requirejs.resolveModuleId(module.id,d)]).then(function(r){return r[0]&&r[0].default?r[0].default:r;});}; imp0r_('hello');});";

  const unit = {
    contents: cjs,
    moduleId: 'cjs',
    path: 'src/cjs.js'
  }
  const r = nameDefine(unit);
  t.deepEqual(r.defined, ['cjs']);
  t.notOk(r.shimed);
  t.deepEqual(r.deps, ['./a', 'hello']);
  t.equal(r.contents, cjsExpected);
  t.end();
});

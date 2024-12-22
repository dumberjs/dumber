const { test } = require("zora");
const { mockBundler } = require("./mock");

test("Bundler traces files", async (t) => {
  const fakeFs = {
    "local/setup.js": "setup",
    "local/after.js": "after",
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "require('loo');",
    "node_modules/foo/bar.js": "",
    "node_modules/loo/package.json": JSON.stringify({
      name: "loo",
      main: "./loo",
    }),
    "node_modules/loo/loo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    prepends: ["var pre = 1;", "", undefined, false, "local/setup.js", null],
    appends: ["local/after.js", "var ape = 1;"],
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');require('page/one');",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/page/one.js",
        contents: "require('foo/bar');require('loo');",
        moduleId: "page/one.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                contents: "var pre = 1;",
              },
              {
                path: "local/setup.js",
                contents: "setup;",
              },
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n",
              },
              {
                path: "src/page/one.js",
                contents:
                  "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/bar.js",
                contents:
                  "define('foo/bar.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('foo/index.js',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.js');",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            appendFiles: [
              {
                path: "local/after.js",
                contents: "after;",
              },
              {
                contents: "var ape = 1;",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler can optionally skip dumber-module-loader", async (t) => {
  const fakeFs = {
    "local/setup.js": "setup",
    "local/after.js": "after",
  };
  const bundler = mockBundler(fakeFs, {
    skipModuleLoader: true,
    prepends: ["dev-dumber-module-loader"],
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({ path: "src/app.js", contents: "", moduleId: "app.js" })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                contents: "dev-dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler traces files, split bundles", async (t) => {
  const fakeFs = {
    "local/setup.js": "setup",
    "local/after.js": "after",
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "require('loo');",
    "node_modules/foo/bar.js": "",
    "node_modules/loo/package.json": JSON.stringify({
      name: "loo",
      main: "./loo",
    }),
    "node_modules/loo/loo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    prepends: ["var pre = 1;", "local/setup.js"],
    appends: ["local/after.js", "var ape = 1;"],
    codeSplit: (moduleId, packageName) => {
      if (packageName) return "vendor";
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');require('page/one');",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/page/one.js",
        contents: "require('foo/bar');require('loo');",
        moduleId: "page/one.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                contents: "var pre = 1;",
              },
              {
                path: "local/setup.js",
                contents: "setup;",
              },
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n",
              },
              {
                path: "src/page/one.js",
                contents:
                  "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n",
              },
            ],
            appendFiles: [
              {
                path: "local/after.js",
                contents: "after;",
              },
              {
                contents: "var ape = 1;",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {
                vendor: {
                  user: [],
                  package: [
                    "foo",
                    "foo/bar.js",
                    "foo/index.js",
                    "loo",
                    "loo/loo.js",
                  ],
                },
              },
            },
          },
          vendor: {
            files: [
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/bar.js",
                contents:
                  "define('foo/bar.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('foo/index.js',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.js');",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler traces files, split bundles, case2", async (t) => {
  const fakeFs = {
    "local/setup.js": "setup",
    "local/after.js": "after",
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "require('loo');",
    "node_modules/foo/bar.js": "",
    "node_modules/loo/package.json": JSON.stringify({
      name: "loo",
      main: "./loo",
    }),
    "node_modules/loo/loo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    prepends: ["var pre = 1;", "local/setup.js"],
    appends: ["local/after.js", "var ape = 1;"],
    entryBundle: "main",
    baseUrl: "scripts",
    codeSplit: (moduleId, packageName) => {
      if (packageName) {
        if (packageName === "loo") return "app";
        return "vendor";
      } else {
        return "app";
      }
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');require('page/one');",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/page/one.js",
        contents: "require('foo/bar');require('loo');",
        moduleId: "page/one.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          main: {
            files: [
              {
                contents: "var pre = 1;",
              },
              {
                path: "local/setup.js",
                contents: "setup;",
              },
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
            ],
            appendFiles: [
              {
                path: "local/after.js",
                contents: "after;",
              },
              {
                contents: "var ape = 1;",
              },
            ],
            config: {
              baseUrl: "scripts",
              paths: {},
              bundles: {
                app: {
                  user: ["app.js", "page/one.js"],
                  package: ["loo", "loo/loo.js"],
                },
                vendor: {
                  user: [],
                  package: ["foo", "foo/bar.js", "foo/index.js"],
                },
              },
            },
          },
          app: {
            files: [
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n",
              },
              {
                path: "src/page/one.js",
                contents:
                  "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
          },
          vendor: {
            files: [
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/bar.js",
                contents:
                  "define('foo/bar.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('foo/index.js',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler traces files, sorts shim", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/jquery/package.json": JSON.stringify({
      name: "jquery",
      main: "dist/jquery",
    }),
    "node_modules/jquery/dist/jquery.js": 'define("jquery",[],function(){});',
    "node_modules/bootstrap/package.json": JSON.stringify({
      name: "bootstrap",
      main: "./dist/bootstrap",
    }),
    "node_modules/bootstrap/dist/bootstrap.js": "",
    "node_modules/fs-browser-stub/package.json": JSON.stringify({
      name: "fs-browser-stub",
      main: "index.js",
    }),
    "node_modules/fs-browser-stub/index.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    deps: [{ name: "bootstrap", deps: ["jquery"], exports: "jQuery" }],
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('fs');require('bootstrap');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','fs','bootstrap'],function (require, exports, module) {\nrequire('fs');require('bootstrap');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/jquery/dist/jquery.js",
                contents: 'define("jquery",[],function(){});',
              },
              {
                path: "node_modules/bootstrap/dist/bootstrap.js",
                contents:
                  ";\ndefine('bootstrap/dist/bootstrap.js',['jquery'],(function (global) {\n  return function () {\n    return global.jQuery;\n  };\n}(this)));\n\n;define.alias('bootstrap','bootstrap/dist/bootstrap.js');",
              },
              {
                path: "node_modules/fs-browser-stub/index.js",
                contents:
                  "define('fs/index.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('fs','fs/index.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler traces files, always sort jquery and moment on top", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/jquery/package.json": JSON.stringify({
      name: "jquery",
      main: "dist/jquery",
    }),
    "node_modules/jquery/dist/jquery.js": 'define("jquery",[],function(){});',
    "node_modules/moment/package.json": JSON.stringify({
      name: "moment",
      main: "./moment",
    }),
    "node_modules/moment/moment.js": "",
    "node_modules/aaa/package.json": JSON.stringify({
      name: "aaa",
      main: "./aaa",
    }),
    "node_modules/aaa/aaa.js": "",
  };
  const bundler = mockBundler(fakeFs);

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('aaa');require('jquery');require('moment');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','aaa','jquery','moment'],function (require, exports, module) {\nrequire('aaa');require('jquery');require('moment');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/jquery/dist/jquery.js",
                contents: 'define("jquery",[],function(){});',
              },
              {
                path: "node_modules/moment/moment.js",
                contents:
                  "define('moment/moment.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('moment','moment/moment.js');",
              },
              {
                path: "node_modules/aaa/aaa.js",
                contents:
                  "define('aaa/aaa.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('aaa','aaa/aaa.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler ignores module when onRequire returns false", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
  };
  const bundler = mockBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === "foo") return false;
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler replaces deps when onRequire returns array", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/bar/package.json": '{"name":"bar"}',
    "node_modules/bar/index.js": "",
    "node_modules/loo/package.json": '{"name":"loo","main":"loo"}',
    "node_modules/loo/loo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === "foo") return ["bar", "loo"];
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/bar/index.js",
                contents:
                  "define('bar/index.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('bar','bar/index.js');",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler supports implementation returned by onRequire", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/loo/package.json": '{"name":"loo","main":"loo"}',
    "node_modules/loo/loo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    onRequire(moduleId) {
      // onRequire can return a Promise to resolve to false, array, or string.
      if (moduleId === "foo") return Promise.resolve("require('loo');");
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "__on_require__/foo.js",
                contents:
                  "define('foo',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler swallows onRequire exception", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": '{"name":"foo","main":"foo"}',
    "node_modules/foo/foo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === "foo") throw new Error("haha");
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/foo.js",
                contents:
                  "define('foo/foo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('foo','foo/foo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler swallows onRequire promise rejection", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": '{"name":"foo","main":"foo"}',
    "node_modules/foo/foo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === "foo") return Promise.reject(new Error("haha"));
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/foo.js",
                contents:
                  "define('foo/foo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('foo','foo/foo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler can use cache", (t) => {
  const bundler = mockBundler({}, { cache: true });
  t.ok(bundler._cache);
});

test("Bundler can turn off cache", (t) => {
  const bundler = mockBundler({}, { cache: false });
  t.notOk(bundler._cache);
});

test("Bundler can customise cache implementation", (t) => {
  const getCache = () => {};
  const setCache = () => {};
  const clearCache = () => {};
  const bundler = mockBundler(
    {},
    { cache: { getCache, setCache, clearCache } }
  );
  t.deepEqual(bundler._cache, { getCache, setCache, clearCache });
});

test("Bundler traces files, split bundles, continuously update bundles in watch mode", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "",
    "node_modules/foo/bar.js": "",
    "node_modules/loo/package.json": JSON.stringify({
      name: "loo",
      main: "./loo",
    }),
    "node_modules/loo/loo.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    codeSplit: (moduleId, packageName) => {
      if (packageName) {
        if (packageName !== "loo") return "vendor-bundle";
      } else {
        if (moduleId.startsWith("page/")) return "page-bundle";
        return "app-bundle";
      }
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');require('page/one');",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/page/one.js",
        contents: "",
        moduleId: "page/one.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {
                "app-bundle": {
                  user: ["app.js"],
                  package: [],
                },
                "page-bundle": {
                  user: ["page/one.js"],
                  package: [],
                },
                "vendor-bundle": {
                  user: [],
                  package: ["foo", "foo/index.js"],
                },
              },
            },
          },
          "app-bundle": {
            files: [
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n",
              },
            ],
          },
          "page-bundle": {
            files: [
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/page/one.js",
                contents:
                  "define('page/one.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
            ],
          },
          "vendor-bundle": {
            files: [
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('foo/index.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('foo','foo/index.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
          },
        });
      },
      (err) => t.fail(err.stack)
    )
    .then(() =>
      bundler.capture({
        path: "src/page/one.js",
        contents: "require('foo/bar');require('loo');",
        moduleId: "page/one.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {
                "app-bundle": {
                  user: ["app.js"],
                  package: [],
                },
                "page-bundle": {
                  user: ["page/one.js"],
                  package: [],
                },
                "vendor-bundle": {
                  user: [],
                  package: ["foo", "foo/bar.js", "foo/index.js"],
                },
              },
            },
          },
          "page-bundle": {
            files: [
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/page/one.js",
                contents:
                  "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n",
              },
            ],
          },
          "vendor-bundle": {
            files: [
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/bar.js",
                contents:
                  "define('foo/bar.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('foo/index.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('foo','foo/index.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
          },
        });
      },
      (err) => t.fail(err.stack)
    )
    .then(() =>
      bundler.capture({ path: "src/goo.js", contents: "", moduleId: "goo.js" })
    )
    .then(() =>
      bundler.capture({
        path: "src/goo2.js",
        contents: "",
        moduleId: "goo2.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/loo/loo.js",
                contents:
                  "define('loo/loo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {
                "app-bundle": {
                  user: ["app.js", "goo.js", "goo2.js"],
                  package: [],
                },
                "page-bundle": {
                  user: ["page/one.js"],
                  package: [],
                },
                "vendor-bundle": {
                  user: [],
                  package: ["foo", "foo/bar.js", "foo/index.js"],
                },
              },
            },
          },
          "app-bundle": {
            files: [
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n",
              },
              {
                path: "src/goo.js",
                contents:
                  "define('goo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                path: "src/goo2.js",
                contents:
                  "define('goo2.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
            ],
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler supports inject css by default", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/dumber/package.json": JSON.stringify({
      name: "dumber",
      main: "./dist/index",
    }),
    "node_modules/dumber/lib/inject-css.js": "",
  };
  const bundler = mockBundler(fakeFs, {});

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('c.css')",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/c.css",
        contents: "lorem",
        moduleId: "c.css",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','c.css'],function (require, exports, module) {\nrequire('c.css')\n});\n",
              },
              {
                path: "src/c.css",
                contents: "define('text!c.css',function(){return \"lorem\";});",
              },
              {
                path: "__stub__/ext-css.js",
                contents:
                  "define('ext:css',['dumber/lib/inject-css'],function(m){return m;});\n;define.alias('ext:less','ext:css');\n;define.alias('ext:scss','ext:css');\n;define.alias('ext:sass','ext:css');\n;define.alias('ext:styl','ext:css');",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/dumber/lib/inject-css.js",
                contents:
                  "define('dumber/lib/inject-css.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler supports inject css (relative path) by default", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/dumber/package.json": JSON.stringify({
      name: "dumber",
      main: "./dist/index",
    }),
    "node_modules/dumber/lib/inject-css.js": "",
  };
  const bundler = mockBundler(fakeFs, {});

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('./c.scss')",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/c.css",
        contents: "lorem",
        moduleId: "c.css",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','./c.scss'],function (require, exports, module) {\nrequire('./c.scss')\n});\n",
              },
              {
                path: "src/c.css",
                contents: "define('text!c.css',function(){return \"lorem\";});",
              },
              {
                path: "__stub__/ext-css.js",
                contents:
                  "define('ext:css',['dumber/lib/inject-css'],function(m){return m;});\n;define.alias('ext:less','ext:css');\n;define.alias('ext:scss','ext:css');\n;define.alias('ext:sass','ext:css');\n;define.alias('ext:styl','ext:css');",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/dumber/lib/inject-css.js",
                contents:
                  "define('dumber/lib/inject-css.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler can optionally turn off inject css", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/dumber/package.json": JSON.stringify({
      name: "dumber",
      main: "./dist/index",
    }),
    "node_modules/dumber/lib/inject-css.js": "",
  };
  const bundler = mockBundler(fakeFs, {
    injectCss: false,
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('c.css')",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/c.css",
        contents: "lorem",
        moduleId: "c.css",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','c.css'],function (require, exports, module) {\nrequire('c.css')\n});\n",
              },
              {
                path: "src/c.css",
                contents: "define('text!c.css',function(){return \"lorem\";});",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler traces files with paths mapping", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "require('loo');",
    "node_modules/bar/package.json": JSON.stringify({
      name: "bar",
      main: "index",
    }),
    "node_modules/bar/index.js": "exports.bar = 1;",
    "node_modules/bar/el.js": "exports.el = 1;",
  };
  const bundler = mockBundler(fakeFs, {
    paths: {
      foo: "common/foo",
      el: "bar/el",
      "../src": "",
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "import 'el!foo';",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/common/foo.js",
        contents: "",
        moduleId: "common/foo.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "test/app.spec.js",
        contents: "import '../src/app';",
        moduleId: "../test/app.spec.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "test/app.spec.js",
                contents:
                  "define('../test/app.spec.js',['require','exports','module','../src/app'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nrequire(\"../src/app\");\n\n});\n",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','el!foo'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nrequire(\"el!foo\");\n\n});\n",
              },
              {
                path: "src/common/foo.js",
                contents:
                  "define('common/foo.js',['require','exports','module'],function (require, exports, module) {\n\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/bar/el.js",
                contents:
                  "define('bar/el.js',['require','exports','module'],function (require, exports, module) {\nexports.el = 1;\n});\n",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {
                foo: "common/foo",
                el: "bar/el",
                "../src": "",
              },
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler allows same modules in both user and package space", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "require('util');",
    "node_modules/foo/bar.js": "exports.bar = 1;",
    "node_modules/util/package.json": JSON.stringify({
      name: "util",
      main: "./util",
    }),
    "node_modules/util/util.js": "exports.util = 1;",
  };
  const bundler = mockBundler(fakeFs);

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "import 'foo';\nimport './util'",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/util.js",
        contents: "export default function(){}",
        moduleId: "util.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','./util'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nrequire(\"foo\");\nrequire(\"./util\");\n\n});\n",
              },
              {
                path: "src/util.js",
                contents:
                  "define('util.js',['require','exports','module'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.default = default_1;\nfunction default_1() { }\n\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('foo/index.js',['require','exports','module','util'],function (require, exports, module) {\nrequire('util');\n});\n\n;define.alias('foo','foo/index.js');",
              },
              {
                path: "node_modules/util/util.js",
                contents:
                  "define('util/util.js',['require','exports','module'],function (require, exports, module) {\nexports.util = 1;\n});\n\n;define.alias('util','util/util.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler supports deps alias", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "exports.foo = 1;",
    "node_modules/foo/bar.js": "exports.bar = 1;",
  };
  const bundler = mockBundler(fakeFs, {
    cache: false,
    deps: [
      {
        name: "bar",
        location: "node_modules/foo",
      },
    ],
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "import 'bar';",
        moduleId: "app.js",
      })
    )
    .then(() =>
      bundler.capture({
        path: "src/foo.js",
        contents: "import 'bar/bar';",
        moduleId: "foo.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','bar'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nrequire(\"bar\");\n\n});\n",
              },
              {
                path: "src/foo.js",
                contents:
                  "define('foo.js',['require','exports','module','bar/bar'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nrequire(\"bar/bar\");\n\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/bar.js",
                contents:
                  "define('bar/bar.js',['require','exports','module'],function (require, exports, module) {\nexports.bar = 1;\n});\n",
              },
              {
                path: "node_modules/foo/index.js",
                contents:
                  "define('bar/index.js',['require','exports','module'],function (require, exports, module) {\nexports.foo = 1;\n});\n\n;define.alias('bar','bar/index.js');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler supports package alias with lazyMain mode", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index",
    }),
    "node_modules/foo/index.js": "exports.foo = 1;",
    "node_modules/foo/bar.js": "exports.bar = 1;",
  };
  const bundler = mockBundler(fakeFs, {
    deps: [
      {
        name: "bar",
        location: "node_modules/foo",
        lazyMain: true,
      },
    ],
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "import 'bar/bar';",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','bar/bar'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nrequire(\"bar/bar\");\n\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/bar.js",
                contents:
                  "define('bar/bar.js',['require','exports','module'],function (require, exports, module) {\nexports.bar = 1;\n});\n",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler creates correct alias for named AMD module which does not match package name", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/noty/package.json": JSON.stringify({
      name: "noty",
      main: "lib/noty.js",
    }),
    "node_modules/noty/lib/noty.js": 'define("Noty",[],function(){});',
  };
  const bundler = mockBundler(fakeFs);

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('noty');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','noty'],function (require, exports, module) {\nrequire('noty');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/noty/lib/noty.js",
                contents:
                  "define(\"Noty\",[],function(){});\n;define.alias('noty','Noty');",
              },
              {
                contents: "define.switchToUserSpace();",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler ignores runtime modules mapped by paths", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
  };
  const bundler = mockBundler(fakeFs, {
    paths: {
      foo: "/path/to/foo/",
      bar: "https://some.cdn.com/bar/",
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('foo');require('bar');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','foo','bar'],function (require, exports, module) {\nrequire('foo');require('bar');\n});\n",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {
                foo: "/path/to/foo",
                bar: "https://some.cdn.com/bar",
              },
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

test("Bundler ignores runtime modules", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
  };
  const bundler = mockBundler(fakeFs);

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents: "require('https://some.cdn.com/foo.js');",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then(
      (bundleMap) => {
        t.deepEqual(bundleMap, {
          "entry-bundle": {
            files: [
              {
                path: "node_modules/dumber-module-loader/dist/index.debug.js",
                contents: "dumber-module-loader;",
              },
              {
                contents: "define.switchToUserSpace();",
              },
              {
                path: "src/app.js",
                contents:
                  "define('app.js',['require','exports','module','https://some.cdn.com/foo.js'],function (require, exports, module) {\nrequire('https://some.cdn.com/foo.js');\n});\n",
              },
            ],
            config: {
              baseUrl: "/dist",
              paths: {},
              bundles: {},
            },
          },
        });
      },
      (err) => t.fail(err.stack)
    );
});

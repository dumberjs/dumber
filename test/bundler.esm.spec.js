const { test } = require("zora");
const { mockBundler } = require("./mock");

test("Bundler traces mixed mjs and cjs npm packages", async (t) => {
  const fakeFs = {
    "local/setup.js": "setup",
    "local/after.js": "after",
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/foo/package.json": JSON.stringify({
      name: "foo",
      main: "index.cjs",
    }),
    "node_modules/foo/index.cjs": "require('loo');",
    "node_modules/loo/package.json": JSON.stringify({
      name: "loo",
      main: "./loo.mjs",
    }),
    "node_modules/loo/loo.mjs": "",
  };
  const bundler = mockBundler(fakeFs, {
    prepends: ["var pre = 1;", "", undefined, false, "local/setup.js", null],
    appends: ["local/after.js", "var ape = 1;"],
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
                  "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n",
              },
              {
                contents: "define.switchToPackageSpace();",
              },
              {
                path: "node_modules/foo/index.cjs",
                contents:
                  "define('foo/index.cjs',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.cjs');",
              },
              {
                path: "node_modules/loo/loo.mjs",
                contents:
                  "define('loo/loo.mjs',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.mjs');",
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

test("Bundler bundles npm package with exports field", async (t) => {
  const fakeFs = {
    "node_modules/dumber-module-loader/dist/index.debug.js":
      "dumber-module-loader",
    "node_modules/esm-env/package.json": JSON.stringify({
      name: "esm-env",
      type: "module",
      exports: {
        ".": {
          types: "./index.d.ts",
          default: "./index.js",
        },
        "./browser": {
          browser: "./true.js",
          development: "./false.js",
          production: "./false.js",
          default: "./browser-fallback.js",
        },
        "./development": {
          development: "./true.js",
          production: "./false.js",
          default: "./dev-fallback.js",
        },
        "./node": {
          node: "./true.js",
          default: "./false.js",
        },
      },
    }),
    "node_modules/esm-env/index.js": `export { default as BROWSER } from 'esm-env/browser';
export { default as DEV } from 'esm-env/development';
export { default as NODE } from 'esm-env/node';
`,
    "node_modules/esm-env/true.js": "export default true;\n",
    "node_modules/esm-env/false.js": "export default false;\n",
    "node_modules/esm-env/dev-fallback.js":
      "export default typeof DEV !== 'undefined';\n",
  };

  const bundler = mockBundler(fakeFs, {
    onRequire: (id) => {
      if (id.startsWith("tslib")) {
        return false;
      }
    },
  });

  return Promise.resolve()
    .then(() =>
      bundler.capture({
        path: "src/app.js",
        contents:
          "import {BROWSER, DEV, NODE} from 'esm-env';\nconsole.log(BROWSER, DEV, NODE);\n",
        moduleId: "app.js",
      })
    )
    .then(() => bundler.resolve())
    .then(() => bundler.bundle())
    .then((bundleMap) => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          files: [
            {
              path: "node_modules/dumber-module-loader/dist/index.debug.js",
              contents: "dumber-module-loader;",
            },
            { contents: "define.switchToUserSpace();" },
            {
              path: "src/app.js",
              contents:
                "define('app.js',['require','exports','module','esm-env'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst esm_env_1 = require(\"esm-env\");\nconsole.log(esm_env_1.BROWSER, esm_env_1.DEV, esm_env_1.NODE);\n\n});\n",
            },
            { contents: "define.switchToPackageSpace();" },
            {
              path: "node_modules/esm-env/dev-fallback.js",
              contents:
                "define('esm-env/dev-fallback.js',['require','exports','module'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.default = typeof DEV !== 'undefined';\n\n});\n\n;define.alias('esm-env/development','esm-env/dev-fallback.js');",
            },
            {
              path: "node_modules/esm-env/false.js",
              contents:
                "define('esm-env/false.js',['require','exports','module'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.default = false;\n\n});\n\n;define.alias('esm-env/node','esm-env/false.js');",
            },
            {
              path: "node_modules/esm-env/index.js",
              contents:
                "define('esm-env/index.js',['require','exports','module','tslib','esm-env/browser','esm-env/development','esm-env/node'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.NODE = exports.DEV = exports.BROWSER = void 0;\nconst tslib_1 = require(\"tslib\");\nvar browser_1 = require(\"esm-env/browser\");\nObject.defineProperty(exports, \"BROWSER\", { enumerable: true, get: function () { return tslib_1.__importDefault(browser_1).default; } });\nvar development_1 = require(\"esm-env/development\");\nObject.defineProperty(exports, \"DEV\", { enumerable: true, get: function () { return tslib_1.__importDefault(development_1).default; } });\nvar node_1 = require(\"esm-env/node\");\nObject.defineProperty(exports, \"NODE\", { enumerable: true, get: function () { return tslib_1.__importDefault(node_1).default; } });\n\n});\n\n;define.alias('esm-env','esm-env/index.js');",
            },
            {
              path: "node_modules/esm-env/true.js",
              contents:
                "define('esm-env/true.js',['require','exports','module'],function (require, exports, module) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.default = true;\n\n});\n\n;define.alias('esm-env/browser','esm-env/true.js');",
            },
            { contents: "define.switchToUserSpace();" },
          ],
          config: { baseUrl: "/dist", paths: {}, bundles: {} },
        },
      });
    });
});

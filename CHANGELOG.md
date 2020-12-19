## [1.14.4](https://github.com/dumberjs/dumber/compare/v1.14.3...v1.14.4) (2020-12-19)


### Bug Fixes

* fallback gracefully for broken browser or module field in package.json ([1e220f5](https://github.com/dumberjs/dumber/commit/1e220f5f1b4ee886fa072b50b20593155e5a6b87)), closes [#23](https://github.com/dumberjs/dumber/issues/23)



## [1.14.3](https://github.com/dumberjs/dumber/compare/v1.14.2...v1.14.3) (2020-11-15)


### Bug Fixes

* use absolute path to bypass weird yarn2 bug ([8f4b8d7](https://github.com/dumberjs/dumber/commit/8f4b8d705efb782e3d712f94baae3e4e34c8b166))



## [1.14.2](https://github.com/dumberjs/dumber/compare/v1.14.1...v1.14.2) (2020-11-15)


### Bug Fixes

* bring back "resolve" for yarn2 compatibility ([512a740](https://github.com/dumberjs/dumber/commit/512a7404ae0c6723227f67d477b137cb592183e4)), closes [#22](https://github.com/dumberjs/dumber/issues/22)



## [1.14.1](https://github.com/dumberjs/dumber/compare/v1.14.0...v1.14.1) (2020-11-02)


### Bug Fixes

* leave dynamic import with full url untouched ([f2205f0](https://github.com/dumberjs/dumber/commit/f2205f0c9ef5574cc71d6053ee7e0fb87738159e)), closes [#21](https://github.com/dumberjs/dumber/issues/21)



# [1.14.0](https://github.com/dumberjs/dumber/compare/v1.13.5...v1.14.0) (2020-10-26)


### Features

* improve tracing performance by avoid parsing unchanged code ([b2c2e38](https://github.com/dumberjs/dumber/commit/b2c2e3810ad1e4671b403a12cdebe12a12c1c045))



## [1.13.5](https://github.com/dumberjs/dumber/compare/v1.13.4...v1.13.5) (2020-10-16)



## [1.13.4](https://github.com/dumberjs/dumber/compare/v1.13.3...v1.13.4) (2020-10-02)


### Bug Fixes

* fix possible failing resolve due to new exports field in package.json ([09d409e](https://github.com/dumberjs/dumber/commit/09d409e89d80a117d35f2ed6a05a22d13b568294))



## [1.13.3](https://github.com/dumberjs/dumber/compare/v1.13.2...v1.13.3) (2020-09-16)


### Bug Fixes

* correctly handle browser field "." replacement ([647d73d](https://github.com/dumberjs/dumber/commit/647d73da807e1c9cb5b87557d29724e0b6980d2e))



## [1.13.2](https://github.com/dumberjs/dumber/compare/v1.13.1...v1.13.2) (2020-07-17)


### Bug Fixes

* fix above the surface json module (e.g. ../package.json) ([b1a7f59](https://github.com/dumberjs/dumber/commit/b1a7f599bad9b8d06d8a50b25dc945db6ec12676))



## [1.13.1](https://github.com/dumberjs/dumber/compare/v1.13.0...v1.13.1) (2020-05-28)



# [1.13.0](https://github.com/dumberjs/dumber/compare/v1.12.9...v1.13.0) (2020-04-18)


### Features

* upgrade to stream-browserify v3 ([889abe0](https://github.com/dumberjs/dumber/commit/889abe011afcbea48a6ebb1f6f55722feea285ce))



## [1.12.9](https://github.com/dumberjs/dumber/compare/v1.12.8...v1.12.9) (2020-04-09)


### Bug Fixes

* ignores runtime modules mapped by paths ([52d7102](https://github.com/dumberjs/dumber/commit/52d7102475bbc2fa470b1810615fa29d5d406428))



## [1.12.8](https://github.com/dumberjs/dumber/compare/v1.12.7...v1.12.8) (2020-04-08)


### Bug Fixes

* fix runtime loading on module with paths mapped https:// ([c1b132e](https://github.com/dumberjs/dumber/commit/c1b132e22edc9f8ab0a7b89e7a42f844dcd204f1))



## [1.12.7](https://github.com/dumberjs/dumber/compare/v1.12.6...v1.12.7) (2020-04-08)


### Bug Fixes

* don't detect false cjs require, properly detect global require usage ([8e25d19](https://github.com/dumberjs/dumber/commit/8e25d19c0c3f781bb9e03cd76cb8f81ceb90ddf6))



## [1.12.6](https://github.com/dumberjs/dumber/compare/v1.12.5...v1.12.6) (2020-04-03)



## [1.12.5](https://github.com/dumberjs/dumber/compare/v1.12.4...v1.12.5) (2020-04-03)



## [1.12.4](https://github.com/dumberjs/dumber/compare/v1.12.3...v1.12.4) (2020-04-03)


### Bug Fixes

* delay version message to construct ([7a8367a](https://github.com/dumberjs/dumber/commit/7a8367af88660eb656d02aa5cc980d1c5733957e))



## [1.12.3](https://github.com/dumberjs/dumber/compare/v1.12.2...v1.12.3) (2020-04-03)



## [1.12.2](https://github.com/dumberjs/dumber/compare/v1.12.1...v1.12.2) (2020-04-02)



## [1.12.1](https://github.com/dumberjs/dumber/compare/v1.12.0...v1.12.1) (2020-04-02)


### Bug Fixes

* meriyah is dep, not devDep ([887b570](https://github.com/dumberjs/dumber/commit/887b57013fd1bb898ea7ab4aac766219665c84a2))



# [1.12.0](https://github.com/dumberjs/dumber/compare/v1.11.6...v1.12.0) (2020-04-02)


### Features

* switch from babel parser to meriyah for performance ([4c817af](https://github.com/dumberjs/dumber/commit/4c817af231e89856201c264f9d844c2cc86a555e))



## [1.11.6](https://github.com/dumberjs/dumber/compare/v1.11.5...v1.11.6) (2020-03-18)


### Bug Fixes

* alias should alias module id too ([28b6fc8](https://github.com/dumberjs/dumber/commit/28b6fc8b4d68f8efffb2c26a801b7e25d8d54d49))



## [1.11.5](https://github.com/dumberjs/dumber/compare/v1.11.4...v1.11.5) (2020-03-06)



## [1.11.4](https://github.com/dumberjs/dumber/compare/v1.11.3...v1.11.4) (2020-03-05)


### Bug Fixes

* fix main alias on file name like index.cjs.js ([3910668](https://github.com/dumberjs/dumber/commit/3910668a86f57812dd8583fdcbcb9a49252ef8eb))
* remove alias check to avoid double strip ([ec804c5](https://github.com/dumberjs/dumber/commit/ec804c5797f618d26f83a9a3af29eac0107bb32a))



## [1.11.3](https://github.com/dumberjs/dumber/compare/v1.11.2...v1.11.3) (2020-03-04)


### Bug Fixes

* dynamic import() should return es namespace ([b7b68b5](https://github.com/dumberjs/dumber/commit/b7b68b5c0839e6e1c80edef9f917dcea50d1a31d))



## [1.11.2](https://github.com/dumberjs/dumber/compare/v1.11.1...v1.11.2) (2020-02-14)


### Bug Fixes

* missing branch ([edebb42](https://github.com/dumberjs/dumber/commit/edebb421469dc7c58d51fc5b2d7e305e0cffe1db))



## [1.11.1](https://github.com/dumberjs/dumber/compare/v1.11.0...v1.11.1) (2020-02-14)


### Bug Fixes

* fix fsExists on dir check ([bcb2d67](https://github.com/dumberjs/dumber/commit/bcb2d6729577f3f70fe27460cf6b3fa9ee784a5e))



# [1.11.0](https://github.com/dumberjs/dumber/compare/v1.10.4...v1.11.0) (2020-02-13)


### Features

* add exists api to package-file-reader to avoid unnecessary io ([7c45630](https://github.com/dumberjs/dumber/commit/7c45630072e71a035c28c9f6eb76e4ac83b93b0e))



## [1.10.4](https://github.com/dumberjs/dumber/compare/v1.10.3...v1.10.4) (2020-02-13)


### Bug Fixes

* lazily resolve package main ([b883b05](https://github.com/dumberjs/dumber/commit/b883b051c2f19601cd33a0f4cae3c3a0c1de3b26))



## [1.10.3](https://github.com/dumberjs/dumber/compare/v1.10.2...v1.10.3) (2020-02-12)


### Bug Fixes

* treat empty cache as no cache ([41460d8](https://github.com/dumberjs/dumber/commit/41460d876962ba84db1c2110944ff84ba8666f16))



## [1.10.2](https://github.com/dumberjs/dumber/compare/v1.10.1...v1.10.2) (2020-02-11)


### Bug Fixes

* package reader needs to bypass traced cache ([c6ed0eb](https://github.com/dumberjs/dumber/commit/c6ed0ebb1a1f1a619c1e13803fcd4c4421949eba))



## [1.10.1](https://github.com/dumberjs/dumber/compare/v1.10.0...v1.10.1) (2020-02-11)


### Bug Fixes

* avoid fetching jsdelivr package.json repeatedly ([b81bc56](https://github.com/dumberjs/dumber/commit/b81bc56b2430fc02048394bf6c3431b8e97d1996))



# [1.10.0](https://github.com/dumberjs/dumber/compare/v1.9.1...v1.10.0) (2020-02-10)


### Features

* support aggressive reading from cache ([dc824d0](https://github.com/dumberjs/dumber/commit/dc824d021f6fc96f8e7d56e5a30a58efabab2f5f))



## [1.9.1](https://github.com/dumberjs/dumber/compare/v1.9.0...v1.9.1) (2020-01-31)


### Bug Fixes

* need to transform cjs/mjs as js code ([2326c49](https://github.com/dumberjs/dumber/commit/2326c4952bc89737761d79209ac4be4e9c9d2018))



# [1.9.0](https://github.com/dumberjs/dumber/compare/v1.8.1...v1.9.0) (2020-01-31)


### Features

* small step to add some support for mjs and cjs files ([a5e1d05](https://github.com/dumberjs/dumber/commit/a5e1d056a5ffda7b2f1cfdc61fae4b1ff17d0c83))



## [1.8.1](https://github.com/dumberjs/dumber/compare/v1.8.0...v1.8.1) (2020-01-28)


### Bug Fixes

* add package main path to cache hash ([f7353ab](https://github.com/dumberjs/dumber/commit/f7353ab2888adba0e2dcba3a2dfd64904938954d))



# [1.8.0](https://github.com/dumberjs/dumber/compare/v1.7.5...v1.8.0) (2020-01-22)


### Features

* add "size" meta data to getCache callback ([0067ae3](https://github.com/dumberjs/dumber/commit/0067ae39516e9f8def21977510221d41378056ad))



## [1.7.5](https://github.com/dumberjs/dumber/compare/v1.7.4...v1.7.5) (2020-01-21)


### Bug Fixes

* synchronously print slow code warning ([0c36984](https://github.com/dumberjs/dumber/commit/0c36984ed8f9aa34ca2b5ca88ef92b34814fc8d3))



## [1.7.4](https://github.com/dumberjs/dumber/compare/v1.7.3...v1.7.4) (2020-01-20)



## [1.7.3](https://github.com/dumberjs/dumber/compare/v1.7.2...v1.7.3) (2020-01-20)



## [1.7.2](https://github.com/dumberjs/dumber/compare/v1.7.1...v1.7.2) (2020-01-19)



## [1.7.1](https://github.com/dumberjs/dumber/compare/v1.7.0...v1.7.1) (2020-01-18)



# [1.7.0](https://github.com/dumberjs/dumber/compare/v1.6.0...v1.7.0) (2020-01-17)


### Features

* calls getCache with meta info to allow user to fine tune cache storage ([c2b08d6](https://github.com/dumberjs/dumber/commit/c2b08d6a40e1b1d713b232548c42e2cca6a9b9de))



# [1.6.0](https://github.com/dumberjs/dumber/compare/v1.5.1...v1.6.0) (2020-01-15)


### Features

* better stub of fs to delay the error in browser ([67b1673](https://github.com/dumberjs/dumber/commit/67b16737e3447f43535602931423d1da064b7412))



## [1.5.1](https://github.com/dumberjs/dumber/compare/v1.5.0...v1.5.1) (2019-12-22)


### Bug Fixes

* avoid warning of unhandled promise reject ([0163b08](https://github.com/dumberjs/dumber/commit/0163b08f48da9ba38a8ec9da2d254831e28722f1))



# [1.5.0](https://github.com/dumberjs/dumber/compare/v1.4.0...v1.5.0) (2019-12-22)


### Bug Fixes

* localStorage api is not available in service worker ([fc49a20](https://github.com/dumberjs/dumber/commit/fc49a20664b6ed15bce2a3dfac3c356e43ed8faf))


### Features

* improve jsdelivr reader by caching file lists result ([45a1faa](https://github.com/dumberjs/dumber/commit/45a1faaf934f6bcdb3b9eee2eef1babea0e08303))



# [1.4.0](https://github.com/dumberjs/dumber/compare/v1.3.1...v1.4.0) (2019-12-20)


### Features

* show additional package config in log ([902383d](https://github.com/dumberjs/dumber/commit/902383d1040d01fb12bdcb1e2e02259f30824c8b))



## [1.3.1](https://github.com/dumberjs/dumber/compare/v1.3.0...v1.3.1) (2019-12-19)


### Bug Fixes

* update to latest estree ImportExpression from @babel/parser ([a105914](https://github.com/dumberjs/dumber/commit/a105914089dd35ebcbf75b071d54008ffb7bc8e5))



# [1.3.0](https://github.com/dumberjs/dumber/compare/v1.2.5...v1.3.0) (2019-12-19)


### Features

* performance boost by paralleling npm package (io) reading ([85a4926](https://github.com/dumberjs/dumber/commit/85a49266bd4362987fa007113dcb8cf5c8f19553))



## [1.2.5](https://github.com/dumberjs/dumber/compare/v1.2.4...v1.2.5) (2019-12-18)



## [1.2.4](https://github.com/dumberjs/dumber/compare/v1.2.3...v1.2.4) (2019-12-17)


### Bug Fixes

* avoid panic when parsing toastr, but doesn't fix toastr bundling ([9024a62](https://github.com/dumberjs/dumber/commit/9024a62fa6227201e1c99bf67699eb9580ea0954))



## [1.2.3](https://github.com/dumberjs/dumber/compare/v1.2.2...v1.2.3) (2019-11-13)


### Bug Fixes

* fix default NODE_ENV value in cache key ([d24dea6](https://github.com/dumberjs/dumber/commit/d24dea62d54b023726a0ee46c319b0d22578548a))



## [1.2.2](https://github.com/dumberjs/dumber/compare/v1.2.1...v1.2.2) (2019-10-16)


### Bug Fixes

* fix missed sourcemap content on cache key ([81060cf](https://github.com/dumberjs/dumber/commit/81060cf))



## [1.2.1](https://github.com/dumberjs/dumber/compare/v1.2.0...v1.2.1) (2019-09-26)


### Bug Fixes

* fix esm-to-cjs error when running bundler inside browser ([a3b9a20](https://github.com/dumberjs/dumber/commit/a3b9a20))



# [1.2.0](https://github.com/dumberjs/dumber/compare/v1.1.2...v1.2.0) (2019-09-23)


### Bug Fixes

* fix jsDeliver reader url issue ([a831fad](https://github.com/dumberjs/dumber/commit/a831fad))


### Features

* refactor forced main, support forced main in jsDelivr ([4fdfb00](https://github.com/dumberjs/dumber/commit/4fdfb00))



## [1.1.2](https://github.com/dumberjs/dumber/compare/v1.1.1...v1.1.2) (2019-09-22)


### Bug Fixes

* use full path for jsdelivr when running dumber in browser ([fcc014a](https://github.com/dumberjs/dumber/commit/fcc014a))



## [1.1.1](https://github.com/dumberjs/dumber/compare/v1.1.0...v1.1.1) (2019-09-22)


### Bug Fixes

* avoid conflict in conventional alias, only apply for package with main with same path prefix ([99b4bba](https://github.com/dumberjs/dumber/commit/99b4bba))
* fix a missing package alias when main file is requested from an explicit require('packageName/main/path'); ([7ecc905](https://github.com/dumberjs/dumber/commit/7ecc905))



# [1.1.0](https://github.com/dumberjs/dumber/compare/v1.0.2...v1.1.0) (2019-09-02)


### Features

* support gulp-dumber-css-module ([2d11107](https://github.com/dumberjs/dumber/commit/2d11107)), closes [#13](https://github.com/dumberjs/dumber/issues/13)



## [1.0.2](https://github.com/dumberjs/dumber/compare/v1.0.1...v1.0.2) (2019-08-30)


### Bug Fixes

* fix wrong removal of js string contains literl "sourceMappingURL" ([73db498](https://github.com/dumberjs/dumber/commit/73db498))



## [1.0.1](https://github.com/dumberjs/dumber/compare/v1.0.0...v1.0.1) (2019-08-30)



# [1.0.0](https://github.com/dumberjs/dumber/compare/v0.14.4...v1.0.0) (2019-08-29)



## [0.14.4](https://github.com/dumberjs/dumber/compare/v0.14.3...v0.14.4) (2019-08-28)


### Bug Fixes

* replace deprecated cherow with @babel/parser (in estree mode) ([896057a](https://github.com/dumberjs/dumber/commit/896057a))



## [0.14.3](https://github.com/dumberjs/dumber/compare/v0.14.2...v0.14.3) (2019-08-09)


### Bug Fixes

* fix regresstion on path to inject-css module ([def96de](https://github.com/dumberjs/dumber/commit/def96de))



## [0.14.2](https://github.com/dumberjs/dumber/compare/v0.14.1...v0.14.2) (2019-08-09)


### Bug Fixes

* fix bad typo mistake in node-env-condition ([6e11ffe](https://github.com/dumberjs/dumber/commit/6e11ffe))



## [0.14.1](https://github.com/dumberjs/dumber/compare/v0.14.0...v0.14.1) (2019-08-09)


### Bug Fixes

* fix missing check in node-env-condition ([17ecb94](https://github.com/dumberjs/dumber/commit/17ecb94))



# [0.14.0](https://github.com/dumberjs/dumber/compare/v0.13.1...v0.14.0) (2019-08-09)


### Features

* support process.env.NODE_ENV ([75a902c](https://github.com/dumberjs/dumber/commit/75a902c))



## [0.13.1](https://github.com/dumberjs/dumber/compare/v0.13.0...v0.13.1) (2019-08-05)



# [0.13.0](https://github.com/dumberjs/dumber/compare/v0.12.7...v0.13.0) (2019-08-05)


### Features

* remove babel transpiling, back to plain commonjs ([f62c8aa](https://github.com/dumberjs/dumber/commit/f62c8aa))


### BREAKING CHANGES

* ensure-parser-set API is changed.



## [0.12.7](https://github.com/dumberjs/dumber/compare/v0.12.6...v0.12.7) (2019-08-04)


### Bug Fixes

* fix missing ext:css plugin for less/sass/scss/styl deps ([3edd9da](https://github.com/dumberjs/dumber/commit/3edd9da))



## [0.12.6](https://github.com/dumberjs/dumber/compare/v0.12.5...v0.12.6) (2019-08-04)


### Bug Fixes

* fix missing css injection for less/scss/sass/styl files ([420e0aa](https://github.com/dumberjs/dumber/commit/420e0aa))


### Features

* support multiple aliases ([6cc5f6b](https://github.com/dumberjs/dumber/commit/6cc5f6b))



## [0.12.5](https://github.com/dumberjs/dumber/compare/v0.12.4...v0.12.5) (2019-07-30)



## [0.12.4](https://github.com/dumberjs/dumber/compare/v0.12.3...v0.12.4) (2019-07-25)



## [0.12.3](https://github.com/dumberjs/dumber/compare/v0.12.2...v0.12.3) (2019-07-16)



## [0.12.2](https://github.com/dumberjs/dumber/compare/v0.12.1...v0.12.2) (2019-07-14)



## [0.12.1](https://github.com/dumberjs/dumber/compare/v0.12.0...v0.12.1) (2019-07-13)



# [0.12.0](https://github.com/dumberjs/dumber/compare/v0.11.7...v0.12.0) (2019-06-26)


### Features

* use the new define.alias func ([a86c32c](https://github.com/dumberjs/dumber/commit/a86c32c))



## [0.11.7](https://github.com/dumberjs/dumber/compare/v0.11.6...v0.11.7) (2019-06-25)


### Bug Fixes

* fix missing main alias for npm package name ended with ".js" ([fa5ffb2](https://github.com/dumberjs/dumber/commit/fa5ffb2))



## [0.11.6](https://github.com/dumberjs/dumber/compare/v0.11.5...v0.11.6) (2019-06-25)


### Bug Fixes

* explicitly fullfill json module to avoid json module dep issue in npm package ([f45809a](https://github.com/dumberjs/dumber/commit/f45809a))



## [0.11.5](https://github.com/dumberjs/dumber/compare/v0.11.4...v0.11.5) (2019-06-04)


### Bug Fixes

* add dynamic import to tracing deps if possible ([1e6d148](https://github.com/dumberjs/dumber/commit/1e6d148))



## [0.11.4](https://github.com/dumberjs/dumber/compare/v0.11.3...v0.11.4) (2019-06-04)


### Bug Fixes

* don't stop transform when incoming sourceMap is broken ([f129439](https://github.com/dumberjs/dumber/commit/f129439))



## [0.11.3](https://github.com/dumberjs/dumber/compare/v0.11.2...v0.11.3) (2019-05-16)


### Bug Fixes

* don't stub text module with identity source map if there is existing map ([3afd5c0](https://github.com/dumberjs/dumber/commit/3afd5c0))



## [0.11.2](https://github.com/dumberjs/dumber/compare/v0.11.1...v0.11.2) (2019-03-19)


### Bug Fixes

* better sources path support for npm package with source map ([825df14](https://github.com/dumberjs/dumber/commit/825df14))
* use a non-empty sourcemap to please applySourceMap merge ([6c64dbf](https://github.com/dumberjs/dumber/commit/6c64dbf))



## [0.11.1](https://github.com/dumberjs/dumber/compare/v0.11.0...v0.11.1) (2019-03-19)



# [0.11.0](https://github.com/dumberjs/dumber/compare/v0.10.0...v0.11.0) (2019-03-19)


### Features

* proper source map rewrite. refactor trace pipeline ([2ddf24e](https://github.com/dumberjs/dumber/commit/2ddf24e)), closes [#6](https://github.com/dumberjs/dumber/issues/6)



# [0.10.0](https://github.com/dumberjs/dumber/compare/v0.9.2...v0.10.0) (2019-03-08)



## [0.9.2](https://github.com/dumberjs/dumber/compare/v0.9.1...v0.9.2) (2019-03-08)


### Bug Fixes

* improve compatibility with legacy libs that depends on jquery on momentjs ([323518d](https://github.com/dumberjs/dumber/commit/323518d))
* skip deps cleanup (remove .js) for UMD file ([c574e29](https://github.com/dumberjs/dumber/commit/c574e29)), closes [#8](https://github.com/dumberjs/dumber/issues/8)
* throw error on broken directory package.json ([b1d859f](https://github.com/dumberjs/dumber/commit/b1d859f))


### Features

* support duplicated module name in both user and package spaces ([6309efe](https://github.com/dumberjs/dumber/commit/6309efe)), closes [#5](https://github.com/dumberjs/dumber/issues/5)



## [0.9.1](https://github.com/dumberjs/dumber/compare/v0.9.0...v0.9.1) (2019-02-10)


### Bug Fixes

* fix a regression of missing css injection on local css ([67e8532](https://github.com/dumberjs/dumber/commit/67e8532))



# [0.9.0](https://github.com/dumberjs/dumber/compare/v0.8.18...v0.9.0) (2019-02-09)


### Bug Fixes

* upgrade dumber-module-loader, use requirejs compatible module.uri ([7fa38f6](https://github.com/dumberjs/dumber/commit/7fa38f6))


### Features

* show real package version for hard coded package main ([37f3bd7](https://github.com/dumberjs/dumber/commit/37f3bd7))



## [0.8.18](https://github.com/dumberjs/dumber/compare/v0.8.17...v0.8.18) (2019-01-18)


### Bug Fixes

* fix typo ([fc388c5](https://github.com/dumberjs/dumber/commit/fc388c5))



## [0.8.17](https://github.com/dumberjs/dumber/compare/v0.8.16...v0.8.17) (2019-01-18)



## [0.8.16](https://github.com/dumberjs/dumber/compare/v0.8.15...v0.8.16) (2019-01-18)


### Bug Fixes

* better cache key with file path ([2f1a554](https://github.com/dumberjs/dumber/commit/2f1a554))
* sync mode for fallback resolve ([35eaffe](https://github.com/dumberjs/dumber/commit/35eaffe))



## [0.8.15](https://github.com/dumberjs/dumber/compare/v0.8.14...v0.8.15) (2019-01-18)



## [0.8.14](https://github.com/dumberjs/dumber/compare/v0.8.13...v0.8.14) (2019-01-18)



## [0.8.13](https://github.com/dumberjs/dumber/compare/v0.8.12...v0.8.13) (2019-01-17)


### Bug Fixes

* fix compatibility with nodejs v8 where URL is not available as global var ([2578785](https://github.com/dumberjs/dumber/commit/2578785))


### Features

* improve efficiency by skipping unchanged files in watch mode ([53caf61](https://github.com/dumberjs/dumber/commit/53caf61))



## [0.8.12](https://github.com/dumberjs/dumber/compare/v0.8.11...v0.8.12) (2019-01-17)



## [0.8.11](https://github.com/dumberjs/dumber/compare/v0.8.10...v0.8.11) (2019-01-16)


### Bug Fixes

* fix sourcesContent format ([d23a56e](https://github.com/dumberjs/dumber/commit/d23a56e))



## [0.8.10](https://github.com/dumberjs/dumber/compare/v0.8.9...v0.8.10) (2019-01-16)


### Bug Fixes

* bring in missing dep ([3b91373](https://github.com/dumberjs/dumber/commit/3b91373))



## [0.8.9](https://github.com/dumberjs/dumber/compare/v0.8.8...v0.8.9) (2019-01-16)


### Features

* inline sourcesContent for all npm package sourceMap ([f30e695](https://github.com/dumberjs/dumber/commit/f30e695))



## [0.8.8](https://github.com/dumberjs/dumber/compare/v0.8.7...v0.8.8) (2019-01-15)


### Bug Fixes

* normalise file path for windows ([fff914d](https://github.com/dumberjs/dumber/commit/fff914d))


### Features

* support sourceMap from npm package ([956a946](https://github.com/dumberjs/dumber/commit/956a946))



## [0.8.7](https://github.com/dumberjs/dumber/compare/v0.8.6...v0.8.7) (2019-01-13)


### Features

* support mapping and tracing plugin module ([bb32149](https://github.com/dumberjs/dumber/commit/bb32149))



## [0.8.6](https://github.com/dumberjs/dumber/compare/v0.8.5...v0.8.6) (2019-01-06)



## [0.8.5](https://github.com/dumberjs/dumber/compare/v0.8.4...v0.8.5) (2019-01-02)


### Bug Fixes

* only skip cjs wrap if amd define is in use ([90f0749](https://github.com/dumberjs/dumber/commit/90f0749))



## [0.8.4](https://github.com/dumberjs/dumber/compare/v0.8.3...v0.8.4) (2018-12-30)


### Features

* support lerna hoisting ([b355daf](https://github.com/dumberjs/dumber/commit/b355daf)), closes [#4](https://github.com/dumberjs/dumber/issues/4)



## [0.8.3](https://github.com/dumberjs/dumber/compare/v0.8.2...v0.8.3) (2018-12-24)



## [0.8.2](https://github.com/dumberjs/dumber/compare/v0.8.1...v0.8.2) (2018-12-23)


### Features

* inject css on demand ([cf2f586](https://github.com/dumberjs/dumber/commit/cf2f586))


### BREAKING CHANGES

* option injectCss is now turned on by default



## [0.8.1](https://github.com/dumberjs/dumber/compare/v0.8.0...v0.8.1) (2018-12-23)


### Bug Fixes

* fix accidentally upgraded readable-stream ([f11b53d](https://github.com/dumberjs/dumber/commit/f11b53d))



# [0.8.0](https://github.com/dumberjs/dumber/compare/v0.7.25...v0.8.0) (2018-12-23)


### Features

* move appends to dedicated section to ensure appends after config ([0528bb9](https://github.com/dumberjs/dumber/commit/0528bb9))


### BREAKING CHANGES

* this requires gulp-dumber update



## [0.7.25](https://github.com/dumberjs/dumber/compare/v0.7.24...v0.7.25) (2018-12-23)


### Bug Fixes

* simply put onRequire module content onto package space ([df28359](https://github.com/dumberjs/dumber/commit/df28359))


### Features

* support requirejs paths config ([f01f263](https://github.com/dumberjs/dumber/commit/f01f263))


### Reverts

* feat: be smart on onRequire stub's module space ([c403add](https://github.com/dumberjs/dumber/commit/c403add))



## [0.7.24](https://github.com/dumberjs/dumber/compare/v0.7.23...v0.7.24) (2018-12-19)



## [0.7.23](https://github.com/dumberjs/dumber/compare/v0.7.22...v0.7.23) (2018-12-18)


### Features

* coloured console log in nodejs env ([e76d173](https://github.com/dumberjs/dumber/commit/e76d173))



## [0.7.22](https://github.com/dumberjs/dumber/compare/v0.7.21...v0.7.22) (2018-12-18)



## [0.7.21](https://github.com/dumberjs/dumber/compare/v0.7.20...v0.7.21) (2018-12-18)


### Features

* be smart on onRequire stub's module space ([3851939](https://github.com/dumberjs/dumber/commit/3851939))



## [0.7.20](https://github.com/dumberjs/dumber/compare/v0.7.19...v0.7.20) (2018-12-18)


### Bug Fixes

* fix onRequire file path ([b0dc772](https://github.com/dumberjs/dumber/commit/b0dc772))



## [0.7.19](https://github.com/dumberjs/dumber/compare/v0.7.18...v0.7.19) (2018-12-17)


### Bug Fixes

* only recover missing main, not broken package.json ([6d08545](https://github.com/dumberjs/dumber/commit/6d08545))



## [0.7.18](https://github.com/dumberjs/dumber/compare/v0.7.17...v0.7.18) (2018-12-17)


### Bug Fixes

* arrayBuffer() stub should return a promise ([4f03a1e](https://github.com/dumberjs/dumber/commit/4f03a1e))



## [0.7.17](https://github.com/dumberjs/dumber/compare/v0.7.16...v0.7.17) (2018-12-17)


### Bug Fixes

* fix missing dep on base64-arraybuffer ([5a07d94](https://github.com/dumberjs/dumber/commit/5a07d94))



## [0.7.16](https://github.com/dumberjs/dumber/compare/v0.7.15...v0.7.16) (2018-12-17)


### Bug Fixes

* fix missing } in wasm wrapper ([cab8453](https://github.com/dumberjs/dumber/commit/cab8453))



## [0.7.15](https://github.com/dumberjs/dumber/compare/v0.7.14...v0.7.15) (2018-12-17)


### Bug Fixes

* fix unknown encoding null for buffer.toString() ([fc61bcc](https://github.com/dumberjs/dumber/commit/fc61bcc))



## [0.7.14](https://github.com/dumberjs/dumber/compare/v0.7.13...v0.7.14) (2018-12-17)


### Features

* basic support of bundling wasm ([3efd5dd](https://github.com/dumberjs/dumber/commit/3efd5dd))



## [0.7.13](https://github.com/dumberjs/dumber/compare/v0.7.12...v0.7.13) (2018-12-17)


### Features

* option to inject css onto html head ([ca45a3c](https://github.com/dumberjs/dumber/commit/ca45a3c)), closes [#1](https://github.com/dumberjs/dumber/issues/1)



## [0.7.12](https://github.com/dumberjs/dumber/compare/v0.7.11...v0.7.12) (2018-12-15)


### Bug Fixes

* change default baseUrl from "dist" to "/dist" to work better in some SPA router ([71f0099](https://github.com/dumberjs/dumber/commit/71f0099))



## [0.7.11](https://github.com/dumberjs/dumber/compare/v0.7.10...v0.7.11) (2018-12-15)


### Bug Fixes

* get missed location and main ([dc7c550](https://github.com/dumberjs/dumber/commit/dc7c550))



## [0.7.10](https://github.com/dumberjs/dumber/compare/v0.7.9...v0.7.10) (2018-12-15)


### Features

* support es dynamic import() ([a9c0caf](https://github.com/dumberjs/dumber/commit/a9c0caf))



## [0.7.9](https://github.com/dumberjs/dumber/compare/v0.7.8...v0.7.9) (2018-12-13)


### Bug Fixes

* need alias for direct browser replacement too ([62d0224](https://github.com/dumberjs/dumber/commit/62d0224))



## [0.7.8](https://github.com/dumberjs/dumber/compare/v0.7.7...v0.7.8) (2018-12-13)


### Bug Fixes

* hopefully fixed stream stub ([e92bc04](https://github.com/dumberjs/dumber/commit/e92bc04))



## [0.7.7](https://github.com/dumberjs/dumber/compare/v0.7.6...v0.7.7) (2018-12-13)


### Bug Fixes

* fix browser replacement on direct resource require ([73d26d8](https://github.com/dumberjs/dumber/commit/73d26d8))
* fix browser replacement on main ([a0b4934](https://github.com/dumberjs/dumber/commit/a0b4934))



## [0.7.6](https://github.com/dumberjs/dumber/compare/v0.7.5...v0.7.6) (2018-12-13)


### Bug Fixes

* use new readable-stream instead of old stream-browserify to stub nodejs core module stream ([f579263](https://github.com/dumberjs/dumber/commit/f579263))



## [0.7.5](https://github.com/dumberjs/dumber/compare/v0.7.4...v0.7.5) (2018-12-13)


### Bug Fixes

* fix false error on stub module ([efe776f](https://github.com/dumberjs/dumber/commit/efe776f))



## [0.7.4](https://github.com/dumberjs/dumber/compare/v0.7.3...v0.7.4) (2018-12-13)


### Bug Fixes

* fix parser on special globals like __defineSetter__ ([36cb1d4](https://github.com/dumberjs/dumber/commit/36cb1d4))


### Features

* support nodejs globals: global, process, Buffer ([a1975c4](https://github.com/dumberjs/dumber/commit/a1975c4))



## [0.7.3](https://github.com/dumberjs/dumber/compare/v0.7.2...v0.7.3) (2018-12-11)


### Features

* make clearCache async ([d40b4b6](https://github.com/dumberjs/dumber/commit/d40b4b6))



## [0.7.2](https://github.com/dumberjs/dumber/compare/v0.7.1...v0.7.2) (2018-12-11)


### Features

* support option skipModuleLoader ([1fc207c](https://github.com/dumberjs/dumber/commit/1fc207c))



## [0.7.1](https://github.com/dumberjs/dumber/compare/v0.7.0...v0.7.1) (2018-12-11)



# [0.7.0](https://github.com/dumberjs/dumber/compare/v0.6.0...v0.7.0) (2018-12-10)


### Features

* ensure ending in semicolon for prepends/appends ([e00be42](https://github.com/dumberjs/dumber/commit/e00be42))



# [0.6.0](https://github.com/dumberjs/dumber/compare/v0.5.1...v0.6.0) (2018-12-10)


### Features

* ignore falsy values in prepends/appends/deps, so it is easier for user to do conditional config ([096fabb](https://github.com/dumberjs/dumber/commit/096fabb))



## [0.5.1](https://github.com/dumberjs/dumber/compare/v0.5.0...v0.5.1) (2018-12-09)



# [0.5.0](https://github.com/dumberjs/dumber/compare/v0.4.10...v0.5.0) (2018-12-09)


### Features

* tolerant missing main file like npm package simple-line-icons ([1fe8744](https://github.com/dumberjs/dumber/commit/1fe8744))



## [0.4.10](https://github.com/dumberjs/dumber/compare/v0.4.9...v0.4.10) (2018-12-07)


### Bug Fixes

* remove sourceMappingUrl from prepends and appends ([803954e](https://github.com/dumberjs/dumber/commit/803954e))



## [0.4.9](https://github.com/dumberjs/dumber/compare/v0.4.8...v0.4.9) (2018-12-07)



## [0.4.8](https://github.com/dumberjs/dumber/compare/v0.4.7...v0.4.8) (2018-12-07)



## [0.4.7](https://github.com/dumberjs/dumber/compare/v0.4.6...v0.4.7) (2018-12-07)



## [0.4.6](https://github.com/dumberjs/dumber/compare/v0.4.5...v0.4.6) (2018-12-06)


### Bug Fixes

* take depsFinder in consideration when doing cache ([5d4be04](https://github.com/dumberjs/dumber/commit/5d4be04))


### Features

* conventional alias from npm package module foo/dist/lib/bar (or foo/dist/_favor_/lib/bar) to foo/bar ([fcb11c9](https://github.com/dumberjs/dumber/commit/fcb11c9))



## [0.4.5](https://github.com/dumberjs/dumber/compare/v0.4.4...v0.4.5) (2018-12-06)


### Bug Fixes

* no warning for empty shim deps ([23c9ae3](https://github.com/dumberjs/dumber/commit/23c9ae3))



## [0.4.4](https://github.com/dumberjs/dumber/compare/v0.4.3...v0.4.4) (2018-12-06)


### Bug Fixes

* cleanup dist folder before build ([1bd842a](https://github.com/dumberjs/dumber/commit/1bd842a))



## [0.4.3](https://github.com/dumberjs/dumber/compare/v0.4.2...v0.4.3) (2018-12-05)



## [0.4.2](https://github.com/dumberjs/dumber/compare/v0.4.1...v0.4.2) (2018-12-05)


### Bug Fixes

* remove inner defined modules from deps ([e772a62](https://github.com/dumberjs/dumber/commit/e772a62))



## [0.4.1](https://github.com/dumberjs/dumber/compare/v0.4.0...v0.4.1) (2018-12-04)



# [0.4.0](https://github.com/dumberjs/dumber/compare/v0.3.0...v0.4.0) (2018-12-04)


### Features

* follow Fred's advice, replace esprima with cherow ([eea54a2](https://github.com/dumberjs/dumber/commit/eea54a2))



# [0.3.0](https://github.com/dumberjs/dumber/compare/v0.2.1...v0.3.0) (2018-12-04)


### Bug Fixes

* fix failures on windows ([ee90d8f](https://github.com/dumberjs/dumber/commit/ee90d8f))



## [0.2.1](https://github.com/huochunpeng/dumber/compare/v0.2.0...v0.2.1) (2018-12-03)


### Bug Fixes

* fix missing dep mkdirp ([11c3808](https://github.com/huochunpeng/dumber/commit/11c3808))



# [0.2.0](https://github.com/huochunpeng/dumber/compare/v0.1.5...v0.2.0) (2018-12-02)


### Bug Fixes

* support stub-module when running dumber in browser ([9aca164](https://github.com/huochunpeng/dumber/commit/9aca164))


### Features

* cache trace ([1cf3e32](https://github.com/huochunpeng/dumber/commit/1cf3e32))



## [0.1.5](https://github.com/huochunpeng/dumber/compare/v0.1.4...v0.1.5) (2018-11-30)



## [0.1.4](https://github.com/huochunpeng/dumber/compare/v0.1.3...v0.1.4) (2018-11-30)


### Features

* support optional onRequire hook ([72cd8ff](https://github.com/huochunpeng/dumber/commit/72cd8ff))



## [0.1.3](https://github.com/huochunpeng/dumber/compare/v0.1.2...v0.1.3) (2018-11-29)


### Bug Fixes

* cleanup switch module space call ([637d5a2](https://github.com/huochunpeng/dumber/commit/637d5a2))



## [0.1.2](https://github.com/huochunpeng/dumber/compare/v0.1.1...v0.1.2) (2018-11-29)


### Bug Fixes

* remove cjs contants from deps ([90eb551](https://github.com/huochunpeng/dumber/commit/90eb551))



## [0.1.1](https://github.com/huochunpeng/dumber/compare/v0.1.0...v0.1.1) (2018-11-29)


### Bug Fixes

* fix dep on [@babel](https://github.com/babel)/core ([6c5ce23](https://github.com/huochunpeng/dumber/commit/6c5ce23))



# 0.1.0 (2018-11-29)


### Bug Fixes

* fix json alias ([130d076](https://github.com/huochunpeng/dumber/commit/130d076))
* use nodejs require.resolve to ensure module resolving compatibility ([986b788](https://github.com/huochunpeng/dumber/commit/986b788))
* **package-locator:** rejects jsDelivr redirection on dir read ([a867d4d](https://github.com/huochunpeng/dumber/commit/a867d4d))
* **trace:** mimic requirejs runtime behaviour, if no module defined, add an empty shim ([8d9d4dd](https://github.com/huochunpeng/dumber/commit/8d9d4dd))


### Features

* add nodejsload to reader, remove mock-fs ([722ad71](https://github.com/huochunpeng/dumber/commit/722ad71))
* alias creates aliases. ([844e02e](https://github.com/huochunpeng/dumber/commit/844e02e))
* allow passing in globalIndentifiers result for efficiency. ([89bc0b9](https://github.com/huochunpeng/dumber/commit/89bc0b9))
* bundler ([be73a3f](https://github.com/huochunpeng/dumber/commit/be73a3f))
* default npm package locator. ([f58584b](https://github.com/huochunpeng/dumber/commit/f58584b))
* defines transform returns js deps. ([b017c8f](https://github.com/huochunpeng/dumber/commit/b017c8f))
* implement r.js commonJs.convert. ([73c2571](https://github.com/huochunpeng/dumber/commit/73c2571))
* implement r.js parse.usesAmdOrRequirejs, but not declaresDefine and defineAmd. ([23132d1](https://github.com/huochunpeng/dumber/commit/23132d1))
* implement r.js parse.usesCommonJs with ast-matcher. ([a032dda](https://github.com/huochunpeng/dumber/commit/a032dda))
* implement r.js transform.toTransport in ast-matcher. ([76ea9c2](https://github.com/huochunpeng/dumber/commit/76ea9c2))
* jsDelivr-npm-package-locator. ([d6c2e8f](https://github.com/huochunpeng/dumber/commit/d6c2e8f))
* json transform into amd. ([5e3630b](https://github.com/huochunpeng/dumber/commit/5e3630b))
* package reader ([b2ba08b](https://github.com/huochunpeng/dumber/commit/b2ba08b))
* parser.usesEsm to check usage of ES module format ([33535b2](https://github.com/huochunpeng/dumber/commit/33535b2))
* resolve-module-id. ([353af30](https://github.com/huochunpeng/dumber/commit/353af30))
* shim support. ([9ff04cf](https://github.com/huochunpeng/dumber/commit/9ff04cf))
* support "json!a.json" for directly using requirejs ([ff24a65](https://github.com/huochunpeng/dumber/commit/ff24a65))
* support package.json browser field ([7cf93b7](https://github.com/huochunpeng/dumber/commit/7cf93b7))
* text transform into amd. ([9452dec](https://github.com/huochunpeng/dumber/commit/9452dec))
* trace unit. ([252bdaf](https://github.com/huochunpeng/dumber/commit/252bdaf))
* understand amdefine. ([ecfd655](https://github.com/huochunpeng/dumber/commit/ecfd655))
* use escope analysis to do true global variable check. ([2835381](https://github.com/huochunpeng/dumber/commit/2835381))




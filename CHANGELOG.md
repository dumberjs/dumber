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




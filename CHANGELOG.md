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




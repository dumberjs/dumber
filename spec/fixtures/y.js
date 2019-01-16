"use strict";

exports.__esModule = true;
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var X =
/*#__PURE__*/
function () {
  function X() {
    this.name = 'Hello';
  }

  var _proto = X.prototype;

  _proto.description = function description() {
    return _lodash.default.trim(this.name);
  };

  return X;
}();

exports.default = X;

//# sourceMappingURL=y.js.map
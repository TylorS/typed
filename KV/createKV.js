"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKV = void 0;
const Eq_1 = require("../Eq/index");
function createKV() {
    return _createKV;
}
exports.createKV = createKV;
function _createKV(key, initial, eq = Eq_1.deepEqualsEq) {
    return {
        key,
        initial,
        ...eq,
    };
}
//# sourceMappingURL=createKV.js.map
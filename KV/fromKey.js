"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromKey = void 0;
const Eq_1 = require("../Eq/index");
const createKV_1 = require("./createKV");
function fromKey(M) {
    const create = createKV_1.createKV();
    return (eq = Eq_1.deepEqualsEq) => (key) => create(key, M.fromReader((e) => e[key]), eq);
}
exports.fromKey = fromKey;
//# sourceMappingURL=fromKey.js.map
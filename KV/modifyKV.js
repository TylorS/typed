"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyKV = void 0;
const function_1 = require("fp-ts/dist/function");
const getKV_1 = require("./getKV");
const setKV_1 = require("./setKV");
function modifyKV(M) {
    const get = getKV_1.getKV(M);
    const set = setKV_1.setKV(M);
    return (f) => (kv) => function_1.pipe(kv, get, M.chain((a) => function_1.pipe(kv, set(f(a)))));
}
exports.modifyKV = modifyKV;
//# sourceMappingURL=modifyKV.js.map
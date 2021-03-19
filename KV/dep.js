"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dep = void 0;
const op_1 = require("./op");
/**
 * A helper from constructing an operation that needs to be provided.
 */
function dep(M) {
    const op = op_1.op(M);
    return () => (key) => op()(key)(M.of);
}
exports.dep = dep;
//# sourceMappingURL=dep.js.map
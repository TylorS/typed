"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.op = void 0;
const function_1 = require("fp-ts/dist/function");
const fromKey_1 = require("./fromKey");
const getKV_1 = require("./getKV");
/**
 * A helper from constructing an operation that needs to be provided.
 */
function op(M) {
    const get = getKV_1.getKV(M);
    const from = fromKey_1.fromKey(M);
    return () => (key) => {
        const getOp = get(from()(key));
        return (f) => function_1.pipe(getOp, M.chain(f));
    };
}
exports.op = op;
//# sourceMappingURL=op.js.map
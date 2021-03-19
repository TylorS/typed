"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKV = void 0;
const MonadReader_1 = require("../MonadReader/index");
const function_1 = require("fp-ts/dist/function");
function getKV(M) {
    return (kv) => function_1.pipe(MonadReader_1.ask(M)(), M.chain((e) => e.getKV(kv)));
}
exports.getKV = getKV;
//# sourceMappingURL=getKV.js.map
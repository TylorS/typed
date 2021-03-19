"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKV = void 0;
const MonadReader_1 = require("../MonadReader/index");
const function_1 = require("fp-ts/dist/function");
function setKV(M) {
    return (value) => (kv) => function_1.pipe(MonadReader_1.ask(M)(), M.chain((x) => x.setKV(value)(kv)));
}
exports.setKV = setKV;
//# sourceMappingURL=setKV.js.map
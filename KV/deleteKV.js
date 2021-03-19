"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteKV = void 0;
const function_1 = require("fp-ts/dist/function");
const Reader_1 = require("fp-ts/dist/Reader");
function deleteKV(M) {
    return (kv) => function_1.pipe(M.fromReader(Reader_1.ask()), M.chain((e) => e.deleteKV(kv)));
}
exports.deleteKV = deleteKV;
//# sourceMappingURL=deleteKV.js.map
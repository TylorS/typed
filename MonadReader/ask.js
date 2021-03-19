"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ask = void 0;
const Reader_1 = require("fp-ts/dist/Reader");
function ask(M) {
    return () => M.fromReader(Reader_1.ask());
}
exports.ask = ask;
//# sourceMappingURL=ask.js.map
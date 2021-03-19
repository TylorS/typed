"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rafEnv = void 0;
const Disposable_1 = require("../Disposable/index");
const function_1 = require("fp-ts/dist/function");
exports.rafEnv = {
    requestAnimateFrame: (resume) => {
        const disposable = Disposable_1.settable();
        const handle = window.requestAnimationFrame(function_1.flow(resume, disposable.addDisposable));
        disposable.addDisposable({ dispose: () => window.cancelAnimationFrame(handle) });
        return disposable;
    },
};
//# sourceMappingURL=rafEnv.js.map
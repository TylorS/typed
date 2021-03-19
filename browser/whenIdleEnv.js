"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whenIdleEnv = void 0;
const Disposable_1 = require("../Disposable/index");
const Resume_1 = require("../Resume/index");
const function_1 = require("fp-ts/dist/function");
exports.whenIdleEnv = {
    whenIdle: (options) => Resume_1.async((resume) => {
        const disposable = Disposable_1.settable();
        const handle = window.requestIdleCallback(function_1.flow(resume, disposable.addDisposable), options);
        disposable.addDisposable({ dispose: () => window.cancelIdleCallback(handle) });
        return disposable;
    }),
};
//# sourceMappingURL=whenIdleEnv.js.map
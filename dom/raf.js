"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raf = void 0;
const Resume_1 = require("../Resume/index");
const raf = (e) => Resume_1.async((cb) => e.requestAnimateFrame(cb));
exports.raf = raf;
//# sourceMappingURL=raf.js.map
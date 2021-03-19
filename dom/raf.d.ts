import { Disposable } from '@most/types';
import { Env } from "../Env/index";
export interface RafEnv {
    readonly requestAnimateFrame: (cb: (time: number) => Disposable) => Disposable;
}
export declare const raf: Env<RafEnv, number>;
//# sourceMappingURL=raf.d.ts.map
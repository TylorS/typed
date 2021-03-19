import { IdleCallbackDeadline, IdleCallbackOptions, WhenIdleEnv } from "../dom/index";
declare global {
    export interface Window {
        readonly requestIdleCallback: (callback: (deadline: IdleCallbackDeadline) => void, opts?: IdleCallbackOptions) => number;
        readonly cancelIdleCallback: (handle: number) => void;
    }
}
export declare const whenIdleEnv: WhenIdleEnv;
//# sourceMappingURL=whenIdleEnv.d.ts.map
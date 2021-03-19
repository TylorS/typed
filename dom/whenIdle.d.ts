import { Env } from "../Env/index";
import { Resume } from "../Resume/index";
/**
 * RequestIdleCallback deadline type
 */
export declare type IdleCallbackDeadline = {
    readonly didTimeout: boolean;
    readonly timeRemaining: () => number;
};
/**
 * Options for requestIdleCallback
 */
export declare type IdleCallbackOptions = {
    readonly timeout: number;
};
export interface WhenIdleEnv {
    readonly whenIdle: (options?: IdleCallbackOptions) => Resume<IdleCallbackDeadline>;
}
export declare const whenIdle: (options?: IdleCallbackOptions) => Env<WhenIdleEnv, IdleCallbackDeadline>;
//# sourceMappingURL=whenIdle.d.ts.map
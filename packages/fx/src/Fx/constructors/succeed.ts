import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Creates an Fx that emits a single value and then completes.
 *
 * @remarks
 * ## Why
 *
 * A known value can enter `Fx` composition without adding failure or service
 * requirements.
 *
 * ## Ownership and lifetime
 *
 * Construction stores the value. Each run offers it exactly once, waits for the sink
 * handler, and completes without acquiring resources.
 *
 * @example
 * ```ts
 * import { collectAll, succeed } from "@typed/fx/Fx"
 *
 * const program = collectAll(succeed({ status: "ready" }))
 * ```
 *
 * @param value - The value to emit.
 * @returns An `Fx` that emits the value.
 * @since 1.0.0
 * @category Value sources
 */
export const succeed = <A>(value: A): Fx<A> =>
  /*#__PURE__*/ make<A>((sink) => sink.onSuccess(value));

/**
 * An Fx that emits `null` exactly once and then completes.
 *
 * @remarks
 * ## Why
 *
 * The shared constant avoids repeatedly spelling `succeed(null)` in optional-value
 * compositions. It is also exported as `null`.
 *
 * ## Ownership and lifetime
 *
 * Each run performs one sink delivery and acquires no resources.
 *
 * @example
 * ```ts
 * import { first, succeedNull } from "@typed/fx/Fx"
 *
 * const program = first(succeedNull)
 * ```
 *
 * @since 1.0.0
 * @category Value sources
 */
export const succeedNull = succeed<null>(null);
export { succeedNull as null };

/**
 * An Fx that emits `undefined` exactly once and then completes.
 *
 * @remarks
 * ## Why
 *
 * The shared constant avoids repeatedly spelling `succeed(undefined)` in optional
 * compositions. It is also exported as `undefined`.
 *
 * ## Ownership and lifetime
 *
 * Each run performs one sink delivery and acquires no resources.
 *
 * @example
 * ```ts
 * import { first, succeedUndefined } from "@typed/fx/Fx"
 *
 * const program = first(succeedUndefined)
 * ```
 *
 * @since 1.0.0
 * @category Value sources
 */
export const succeedUndefined = succeed<undefined>(undefined);
export { succeedUndefined as undefined };

/**
 * An Fx that emits `void` exactly once and then completes.
 *
 * @remarks
 * ## Why
 *
 * The shared constant is a completion pulse for operations whose payload is
 * irrelevant. It is also exported as `void`.
 *
 * ## Ownership and lifetime
 *
 * Each run performs one sink delivery and acquires no resources.
 *
 * @example
 * ```ts
 * import { drain, succeedVoid } from "@typed/fx/Fx"
 *
 * const program = drain(succeedVoid)
 * ```
 *
 * @since 1.0.0
 * @category Value sources
 */
export const succeedVoid = succeed<void>(void 0);
export { succeedVoid as void };

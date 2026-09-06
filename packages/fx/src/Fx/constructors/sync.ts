import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { fromEffect } from "./fromEffect.js";

/**
 * Lazily evaluates a synchronous function once for each Fx run.
 *
 * @remarks
 * ## Why
 *
 * `sync` is the direct constructor for one value that must be computed at run time,
 * such as a fresh DOM node or a snapshot read from an imperative API. Unlike
 * `succeed`, it does not evaluate the function while the Fx is being assembled.
 *
 * ## Ownership and lifetime
 *
 * Construction performs no work. Each run evaluates `evaluate` exactly once in the
 * run's fiber, emits its result, and completes after the Sink handles it. A thrown
 * exception is an Effect defect; use `Fx.fromEffect(Effect.try(...))` when failure is
 * expected and belongs in the typed error channel.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const element = Fx.sync(() => document.createElement("div"))
 * ```
 *
 * @param evaluate - The synchronous function evaluated once per run.
 * @returns An Fx that emits the freshly evaluated value.
 * @since 2.0.0
 * @category Value sources
 */
export const sync = <A>(evaluate: () => A): Fx<A> => fromEffect(Effect.sync(evaluate));

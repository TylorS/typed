import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Defers creation of an `Fx` until each run begins.
 *
 * @remarks
 * ## Why
 *
 * Recursive producers and producers whose definition depends on fresh mutable state
 * need laziness at the `Fx` boundary, not merely laziness of a value emission.
 *
 * ## Ownership and lifetime
 *
 * `fx` is not evaluated during construction. It is evaluated once per run inside
 * `Effect.suspend`; thrown exceptions become Effect defects, and the returned
 * producer is owned and interrupted as part of that same run.
 *
 * @example
 * ```ts
 * import { collectAll, succeed, suspend } from "@typed/fx/Fx"
 *
 * let next = 0
 * const source = suspend(() => succeed(++next))
 * const firstRun = collectAll(source)
 * const secondRun = collectAll(source)
 * ```
 *
 * @since 1.0.0
 * @category Value sources
 */
export const suspend = <A, E, R>(fx: () => Fx<A, E, R>): Fx<A, E, R> =>
  make<A, E, R>((sink) => Effect.suspend(() => fx().run(sink)));

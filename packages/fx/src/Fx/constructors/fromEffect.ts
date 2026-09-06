import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Creates an Fx from an Effect.
 *
 * If the Effect succeeds, the Fx emits the value and completes.
 * If the Effect fails, the Fx fails with the same error.
 *
 * @remarks
 * ## Why
 *
 * A single Effect result can enter push composition without losing its typed error
 * or service requirements.
 *
 * ## Ownership and lifetime
 *
 * Conversion is lazy. Each run executes the Effect once in the run's fiber, forwards
 * its success or full cause to the sink, and completes after the sink handler. The
 * run's interruption and scope own any acquisition performed by the Effect.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { collectAll, fromEffect } from "@typed/fx/Fx"
 *
 * const source = fromEffect(Effect.succeed(42))
 * const program = collectAll(source)
 * ```
 *
 * @param effect - The effect to convert.
 * @returns An `Fx` representing the execution of the effect.
 * @since 1.0.0
 * @category Effect interop
 */
export const fromEffect = <A, E = never, R = never>(effect: Effect.Effect<A, E, R>): Fx<A, E, R> =>
  /*#__PURE__*/ make<A, E, R>((sink) => Effect.matchCauseEffect(effect, sink));

/**
 * An Fx that waits forever without emitting a value.
 *
 * @remarks
 * ## Why
 *
 * `never` models an intentionally open producer and is useful as a neutral branch in
 * races, switches, and lifetime tests.
 *
 * ## Ownership and lifetime
 *
 * Each run remains suspended until its owning fiber is interrupted. It allocates no
 * independent timer or background fiber.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import { fork, never } from "@typed/fx/Fx"
 *
 * const running = fork(never)
 * const program = Effect.flatMap(running, Fiber.interrupt)
 * ```
 *
 * @since 1.0.0
 * @category Value sources
 */
export const never: Fx<never, never, never> = make<never, never, never>(() => Effect.never);

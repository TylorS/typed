import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import { succeed } from "../constructors/succeed.js";
import type { Fx } from "../Fx.js";

/**
 * Continues an Fx with a lazily created Fx after the first run returns.
 *
 * @remarks
 * ## Why
 *
 * This sequences two producer runs without converting either to a pull
 * collection. The thunk is lazy, so the continuation is not constructed until
 * the first `Fx.run` Effect returns.
 *
 * ## Ordering and cardinality
 *
 * All successes from `fx` are delivered before successes from `f()`. A source
 * failure is also delivered to the shared Sink, but delivery does not fail
 * `Fx.run`: `Sink.onFailure` returns an Effect whose error channel is `never`.
 * After that handler returns, the continuation still runs. The two producers
 * never run concurrently.
 *
 * ## Ownership and lifetime
 *
 * Failures and service requirements from both producers remain on the public
 * type and both failures are delivered to the same Sink. The returned Fx owns
 * neither input. Interruption or a defect that prevents the first run Effect
 * from returning also prevents the continuation from starting.
 *
 * @example
 * ```ts
 * import { Fx, Sink } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const events: Array<string> = []
 * const phases = Fx.continueWith(Fx.fail("offline"), () => Fx.succeed("fallback"))
 * const program = phases.run(Sink.make(
 *   () => Effect.sync(() => events.push("failure delivered")),
 *   (value) => Effect.sync(() => events.push(value))
 * ))
 *
 * Effect.runPromise(program).then(() => console.log(events))
 * // ["failure delivered", "fallback"]
 * ```
 *
 * @param f - A function that returns the next Fx to run.
 * @returns An `Fx` that emits values from the first Fx, then from the second Fx.
 * @since 1.0.0
 * @category Combining sources
 */
export const continueWith: {
  <B, E2, R2>(f: () => Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2>;

  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: () => Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: () => Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2> =>
    make<A | B, E | E2, R | R2>((sink) => Effect.flatMap(fx.run(sink), () => f().run(sink))),
);

/**
 * Appends a value to the end of an Fx.
 *
 * @remarks
 * ## Why
 *
 * `append` is the constant-value specialization of {@link continueWith}. It
 * emits a terminal marker after the source run returns, including after a source
 * failure has been delivered to the Sink.
 *
 * ## Ownership and lifetime
 *
 * The value is emitted exactly once after every source success and any delivered
 * source failure. Interruption or a defect that prevents the source run from
 * returning suppresses it. No resource is acquired; the source error, services,
 * and observation lifetime are unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const framed = Fx.append(Fx.fromIterable([1, 2]), "done")
 * Effect.runPromise(Fx.collectAll(framed)).then(console.log)
 * // [1, 2, "done"]
 * ```
 *
 * @param value - The value to append.
 * @returns An `Fx` that emits values from the input Fx, then the appended value.
 * @since 1.0.0
 * @category Combining sources
 */
export const append: {
  <B>(value: B): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E, R>;

  <A, E, R, B>(fx: Fx<A, E, R>, value: B): Fx<A | B, E, R>;
} = dual(
  2,
  <A, E, R, B>(fx: Fx<A, E, R>, value: B): Fx<A | B, E, R> =>
    continueWith(fx, () => succeed(value)),
);

/**
 * Prepends a value to the beginning of an Fx.
 *
 * @remarks
 * ## Why
 *
 * `prepend` emits an initial marker through the same Sink before the source is
 * observed, without allocating a separate collection or state holder.
 *
 * ## Ownership and lifetime
 *
 * The value is emitted exactly once before the source run starts, then every
 * source success or failure is delivered. Interruption or a defect in the Sink's
 * prepended-value handler prevents the source from starting. The operation
 * acquires no resource and retains source failure, services, and lifetime.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const framed = Fx.prepend(Fx.fromIterable([1, 2]), "start")
 * Effect.runPromise(Fx.collectAll(framed)).then(console.log)
 * // ["start", 1, 2]
 * ```
 *
 * @param value - The value to prepend.
 * @returns An `Fx` that emits the prepended value, then values from the input Fx.
 * @since 1.0.0
 * @category Combining sources
 */
export const prepend: {
  <B>(value: B): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E, R>;

  <A, E, R, B>(fx: Fx<A, E, R>, value: B): Fx<B | A, E, R>;
} = dual(
  2,
  <A, E, R, B>(fx: Fx<A, E, R>, value: B): Fx<B | A, E, R> =>
    continueWith(succeed(value), () => fx),
);

/**
 * Wraps an Fx with a start and end value.
 *
 * @remarks
 * ## Why
 *
 * `delimit` composes {@link prepend} and {@link append} for protocols whose
 * normal run must be bracketed by values rather than resource finalizers.
 *
 * ## Ownership and lifetime
 *
 * `before` is emitted once, followed by every source success or delivered source
 * failure, then `after` once when the source run Effect returns. Interruption or
 * a defect suppresses `after`; this is Sink sequencing, not `Effect.ensuring`.
 * No resource is acquired and source requirements are kept.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const framed = Fx.delimit(Fx.fromIterable([1, 2]), "[", "]")
 * Effect.runPromise(Fx.collectAll(framed)).then(console.log)
 * // ["[", 1, 2, "]"]
 * ```
 *
 * @param before - The value to emit before the Fx starts.
 * @param after - The value to emit after the Fx completes.
 * @returns An `Fx` that emits `before`, then values from the input Fx, then `after`.
 * @since 1.0.0
 * @category Combining sources
 */
export const delimit: {
  <B, C>(before: B, after: C): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B | C, E, R>;

  <A, E, R, B, C>(fx: Fx<A, E, R>, before: B, after: C): Fx<A | B | C, E, R>;
} = dual(
  3,
  <A, E, R, B, C>(fx: Fx<A, E, R>, before: B, after: C): Fx<A | B | C, E, R> =>
    fx.pipe(prepend(before), append(after)),
);

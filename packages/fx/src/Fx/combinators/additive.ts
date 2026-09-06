import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { continueWith } from "./continueWith.js";
import { filter } from "./filter.js";
import { map } from "./map.js";
import { mergeAll } from "./mergeAll.js";
import { zip } from "./zip.js";

/**
 * Merges two Fx streams into a single Fx that emits values from both streams
 * concurrently. Order of emission is non-deterministic.
 *
 * **Completion:** The merged stream completes when **both** input streams have
 * completed.
 *
 * **Failures:** Every failure Cause is delivered to the downstream Sink. Delivery does not make
 * `Fx.run` fail, so `merge` does not itself cancel the sibling; a terminal observer may choose to.
 *
 * @remarks
 * ## Why
 * `merge` preserves both producers instead of imposing a pairing relationship. Each input value is
 * emitted once as soon as its source pushes it, so inter-source ordering is intentionally undefined.
 *
 * ## Ownership and lifetime
 * Both runs are children of the consumer and completion waits for both. Downstream interruption
 * cancels the remaining runs. A source Cause is only sent to `sink.onFailure`; whether that callback
 * ends observation is Sink policy, not an intrinsic terminal rule of `merge`.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const deliveries = yield* Ref.make<Array<string>>([])
 *   const sink = Sink.make(
 *     () => Ref.update(deliveries, (xs) => [...xs, "failure"]),
 *     (value: string) => Ref.update(deliveries, (xs) => [...xs, value])
 *   )
 *   yield* Fx.merge(Fx.fail("left failed"), Fx.succeed("right continued")).run(sink)
 *   return yield* Ref.get(deliveries) // both "failure" and "right continued"
 * })
 * ```
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits values from both streams.
 * @since 1.0.0
 * @category Combining sources
 */
export const merge: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2> =>
    mergeAll(self, that),
);

/**
 * Concatenates two Fx streams: runs the first to completion, then runs the
 * second. Emits all values from the first stream in order, then all values
 * from the second stream in order.
 *
 * **Completion:** The concatenated stream completes when the **second** stream
 * completes (the first must complete before the second starts).
 *
 * **Failures:** A source Cause is delivered to the Sink. Because `Fx.run` is infallible, delivery
 * alone does not suppress the continuation: the right source is run after the left run returns.
 *
 * @remarks
 * ## Why
 * `concat` makes subscription order explicit: the right source is not acquired until the left run
 * returns. It preserves every value and each source's internal order. A failure callback can be
 * followed by continuation values when the Sink handles the Cause without interrupting the run.
 *
 * ## Ownership and lifetime
 * Only one source is active at a time. Interruption stops the active source and prevents later
 * acquisition. Failure is Sink delivery rather than a failing `Fx.run` Effect, so it does not by
 * itself prevent the right source from being acquired.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const deliveries = yield* Ref.make<Array<string>>([])
 *   const sink = Sink.make(
 *     () => Ref.update(deliveries, (xs) => [...xs, "failure"]),
 *     (value: string) => Ref.update(deliveries, (xs) => [...xs, value])
 *   )
 *   yield* Fx.concat(Fx.fail("left failed"), Fx.succeed("right still runs")).run(sink)
 *   return yield* Ref.get(deliveries) // ["failure", "right still runs"]
 * })
 * ```
 *
 * @param that - The second Fx stream (run after the first completes).
 * @returns An Fx that emits values from the first stream, then the second.
 * @since 1.0.0
 * @category Combining sources
 */
export const concat: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2> =>
    continueWith(self, () => that),
);

/**
 * Zips two Fx streams in strict lockstep and emits only the left value.
 * Completes when the **first** of the two streams completes.
 *
 * @remarks
 * ## Why
 * `zipLeft` uses the right source as a one-for-one pacing or validation partner while retaining the
 * left payload. It emits one left value per completed pair and preserves pair order.
 *
 * ## Ownership and lifetime
 * Both sources run concurrently. The first run to complete ends pairing and interrupts the other,
 * while consumer interruption stops both. A failure Cause is delivered to the Sink but does not by
 * itself end pairing; a producer may continue and supply a value afterward.
 *
 * @example
 * ```ts
 * import { Cause, Effect, Ref } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const deliveries = yield* Ref.make<Array<string>>([])
 *   const left = Fx.make<number, string>((sink) =>
 *     sink.onFailure(Cause.fail("warning")).pipe(Effect.andThen(sink.onSuccess(1)))
 *   )
 *   yield* Fx.zipLeft(left, Fx.succeed("pair")).run(Sink.make(
 *     () => Ref.update(deliveries, (xs) => [...xs, "failure"]),
 *     (value) => Ref.update(deliveries, (xs) => [...xs, `value:${value}`])
 *   ))
 *   return yield* Ref.get(deliveries) // ["failure", "value:1"]
 * })
 * ```
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits values from the left stream only.
 * @since 1.0.0
 * @category Combining sources
 */
export const zipLeft: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(2, <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2> =>
  map(zip(self, that), (pair) => pair[0]),
);

/**
 * Zips two Fx streams in strict lockstep and emits only the right value.
 * Completes when the **first** of the two streams completes.
 *
 * @remarks
 * ## Why
 * `zipRight` pairs both sources but deliberately keeps the right payload. It emits once per pair,
 * in pairing order, and never emits an unmatched right value.
 *
 * ## Ownership and lifetime
 * Both runs belong to the consumer. The first completion or consumer interruption cancels the
 * remaining run and releases the lockstep queues. Failure is Sink delivery, not an automatic stop;
 * pairing can continue when the failing producer remains active and later emits a value.
 *
 * @example
 * ```ts
 * import { Cause, Effect } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 *
 * const left = Fx.make<number, string>((sink) =>
 *   sink.onFailure(Cause.fail("warning")).pipe(Effect.andThen(sink.onSuccess(1)))
 * )
 * const program = Fx.zipRight(left, Fx.succeed("paired")).run(
 *   Sink.make(Effect.logError, Effect.log)
 * ) // logs the failure and then "paired"
 * ```
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits values from the right stream only.
 * @since 1.0.0
 * @category Combining sources
 */
export const zipRight: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2> =>
    map(zip(self, that), (pair) => pair[1]),
);

type TaggedLeft<A> = { readonly _tag: "Left"; readonly value: A };
type TaggedRight<A2> = { readonly _tag: "Right"; readonly value: A2 };

/**
 * Merges two Fx streams and emits only values from the left stream.
 * Both streams run concurrently; completion when **both** complete.
 *
 * @remarks
 * ## Why
 * `mergeLeft` keeps the right producer's lifetime and failure signal while suppressing its values.
 * Every left value is emitted once; right emissions only affect scheduling.
 *
 * ## Ownership and lifetime
 * Both sources are acquired together and owned by the consuming run. Interruption cancels both and
 * normal completion waits for both. A Cause from either source is delivered to the Sink but does not
 * intrinsically cancel its sibling; right successes remain suppressed by the filter.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const failures = yield* Ref.make(0)
 *   yield* Fx.mergeLeft(Fx.succeed("visible"), Fx.fail("hidden side failed")).run(
 *     Sink.make(() => Ref.update(failures, (n) => n + 1), () => Effect.void)
 *   )
 *   return yield* Ref.get(failures) // 1; failure is still delivered
 * })
 * ```
 *
 * @param that - The second Fx stream (values are dropped).
 * @returns An Fx that emits only values from the left stream.
 * @since 1.0.0
 * @category Combining sources
 */
export const mergeLeft: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2> => {
    const taggedLeft = map(self, (a: A): TaggedLeft<A> => ({ _tag: "Left", value: a }));
    const taggedRight = map(that, (b: A2): TaggedRight<A2> => ({ _tag: "Right", value: b }));
    const merged = mergeAll(taggedLeft, taggedRight);
    const leftOnly = filter(merged, (x): x is TaggedLeft<A> => x._tag === "Left");
    return map(leftOnly, (x) => x.value) as Fx<A, E | E2, R | R2>;
  },
);

/**
 * Merges two Fx streams and emits only values from the right stream.
 * Both streams run concurrently; completion when **both** complete.
 *
 * @remarks
 * ## Why
 * `mergeRight` observes the left producer's completion and failure while exposing only right
 * values. Each right value is emitted once with no deterministic ordering against hidden left work.
 *
 * ## Ownership and lifetime
 * The consumer owns both concurrent runs and normal completion waits for both. Interruption cancels
 * both. A Cause is delivered to the Sink without inherently canceling the sibling; left successes
 * remain suppressed even while their failures are observable.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const values = yield* Ref.make<Array<string>>([])
 *   yield* Fx.mergeRight(Fx.fail("hidden side failed"), Fx.succeed("visible")).run(
 *     Sink.make(() => Effect.void, (value) => Ref.update(values, (xs) => [...xs, value]))
 *   )
 *   return yield* Ref.get(values) // ["visible"]
 * })
 * ```
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits only values from the right stream.
 * @since 1.0.0
 * @category Combining sources
 */
export const mergeRight: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2> => {
    const taggedLeft = map(self, (a: A): TaggedLeft<A> => ({ _tag: "Left", value: a }));
    const taggedRight = map(that, (b: A2): TaggedRight<A2> => ({ _tag: "Right", value: b }));
    const merged = mergeAll(taggedLeft, taggedRight);
    const rightOnly = filter(merged, (x): x is TaggedRight<A2> => x._tag === "Right");
    return map(rightOnly, (x) => x.value) as Fx<A2, E | E2, R | R2>;
  },
);

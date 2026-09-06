import type { NonEmptyReadonlyArray } from "effect/Array";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { fail } from "../constructors/fail.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

const isGroupSize = (n: number): boolean => Number.isSafeInteger(n) && n > 0;
const invalidGroupSize = (): Cause.IllegalArgumentError =>
  new Cause.IllegalArgumentError("Group size must be a positive safe integer");

/**
 * Partitions the stream into non-empty arrays of size `n`. The final array
 * may be smaller if there are leftover elements.
 * The size must be a positive safe integer. A group can retain up to `n`
 * values, so callers own the memory policy for valid sizes. Invalid sizes
 * fail with `Cause.IllegalArgumentError`.
 *
 * Matches Effect `Stream.grouped`.
 *
 * @remarks
 * ## Why
 * `grouped` exposes fixed-size batching without changing source order. Full groups contain exactly
 * `n` values. Because failure is delivered to the Sink while `Fx.run` remains infallible, any
 * partial group is flushed after the source run returns even if a failure was delivered first.
 *
 * ## Ownership and lifetime
 * Each run retains at most `n` values and releases its buffer after the final flush or interruption.
 * Invalid sizes deliver failure before source acquisition. A terminal observer may interrupt before
 * the post-failure flush, but a Sink that handles the Cause can receive the partial group afterward.
 *
 * @example
 * ```ts
 * import { Cause, Effect, Ref } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 * const program = Effect.gen(function* () {
 *   const deliveries = yield* Ref.make<Array<string>>([])
 *   const source = Fx.make<number, string>((sink) =>
 *     sink.onSuccess(1).pipe(Effect.andThen(sink.onFailure(Cause.fail("boom"))))
 *   )
 *   yield* Fx.grouped(source, 2).run(Sink.make(
 *     () => Ref.update(deliveries, (xs) => [...xs, "failure"]),
 *     (group) => Ref.update(deliveries, (xs) => [...xs, `group:${group.join(",")}`])
 *   ))
 *   return yield* Ref.get(deliveries) // ["failure", "group:1"]
 * })
 * ```
 *
 * @since 1.0.0
 * @category Stateful transforms
 */
export const grouped: {
  (
    n: number,
  ): <A, E, R>(
    self: Fx<A, E, R>,
  ) => Fx<NonEmptyReadonlyArray<A>, E | Cause.IllegalArgumentError, R>;
  <A, E, R>(
    self: Fx<A, E, R>,
    n: number,
  ): Fx<NonEmptyReadonlyArray<A>, E | Cause.IllegalArgumentError, R>;
} = dual(
  2,
  <A, E, R>(
    self: Fx<A, E, R>,
    n: number,
  ): Fx<NonEmptyReadonlyArray<A>, E | Cause.IllegalArgumentError, R> => {
    if (!isGroupSize(n)) {
      return fail(invalidGroupSize());
    }
    const size = n;
    return make<NonEmptyReadonlyArray<A>, E, R>((sink) =>
      Effect.gen(function* () {
        const buffer: Array<A> = [];
        yield* self.run(
          makeSink(sink.onFailure, (a: A) => {
            buffer.push(a);
            if (buffer.length >= size) {
              const group = buffer.splice(0, size) as unknown as NonEmptyReadonlyArray<A>;
              return sink.onSuccess(group);
            }
            return Effect.void;
          }),
        );
        if (buffer.length > 0) {
          yield* sink.onSuccess(buffer as unknown as NonEmptyReadonlyArray<A>);
        }
      }),
    );
  },
);

/**
 * Partitions the stream into arrays, emitting when `n` is reached or `duration`
 * elapses after the first element of the current group.
 * The size must be a positive safe integer. A group can retain up to `n`
 * values, so callers own the memory policy for valid sizes. Invalid sizes
 * fail with `Cause.IllegalArgumentError`.
 *
 * Matches Effect `Stream.groupedWithin`.
 *
 * @remarks
 * ## Why
 * `groupedWithin` bounds a batch by both cardinality and time. The timer starts with the first value,
 * and whichever boundary wins emits the ordered non-empty group and resets both buffer and timer.
 * A partial group is also flushed when the source run returns, including after delivered failure.
 *
 * ## Ownership and lifetime
 * Each run retains at most `n` values and at most one timer fiber in the required Scope. A source
 * failure is Sink delivery, so `flushNow` still runs afterward unless the consumer interrupts the
 * run. Flushing or interruption cancels the timer; invalid sizes fail before subscription.
 *
 * @example
 * ```ts
 * import { Cause, Effect } from "effect"
 * import { Fx, Sink } from "@typed/fx"
 * const source = Fx.make<number, string>((sink) =>
 *   sink.onSuccess(1).pipe(Effect.andThen(sink.onFailure(Cause.fail("boom"))))
 * )
 * const program = Fx.groupedWithin(source, 2, "1 hour").run(
 *   Sink.make(Effect.logError, (group) => Effect.log(group))
 * ) // logs the failure, then flushes [1]
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const groupedWithin: {
  (
    n: number,
    duration: Duration.Input,
  ): <A, E, R>(
    self: Fx<A, E, R>,
  ) => Fx<NonEmptyReadonlyArray<A>, E | Cause.IllegalArgumentError, R | Scope.Scope>;
  <A, E, R>(
    self: Fx<A, E, R>,
    n: number,
    duration: Duration.Input,
  ): Fx<NonEmptyReadonlyArray<A>, E | Cause.IllegalArgumentError, R | Scope.Scope>;
} = dual(
  3,
  <A, E, R>(
    self: Fx<A, E, R>,
    n: number,
    duration: Duration.Input,
  ): Fx<NonEmptyReadonlyArray<A>, E | Cause.IllegalArgumentError, R | Scope.Scope> => {
    if (!isGroupSize(n)) {
      return fail(invalidGroupSize());
    }
    const size = n;
    return make<NonEmptyReadonlyArray<A>, E, R | Scope.Scope>(
      Effect.fn(function* (sink) {
        const ctx = yield* Effect.context<Scope.Scope>();
        const scope = Context.get(ctx, Scope.Scope);
        const buffer = yield* Ref.make<Array<A>>([]);
        const timer = yield* Ref.make<Fiber.Fiber<void, never> | null>(null);

        const clearTimer = Effect.flatMap(Ref.getAndSet(timer, null), (fiber) =>
          fiber ? Fiber.interrupt(fiber) : Effect.void,
        );

        const emitBuffer = Effect.gen(function* () {
          const group = yield* Ref.getAndSet(buffer, []);
          if (group.length > 0) {
            yield* sink.onSuccess(group as unknown as NonEmptyReadonlyArray<A>);
          }
        });

        const flushNow = clearTimer.pipe(Effect.andThen(emitBuffer));
        const flushFromTimer = Ref.set(timer, null).pipe(Effect.andThen(emitBuffer));

        const arm = Effect.flatMap(
          Effect.forkIn(Effect.sleep(duration).pipe(Effect.andThen(flushFromTimer)), scope, {
            startImmediately: true,
            uninterruptible: false,
          }),
          (fiber) => Ref.set(timer, fiber),
        );

        yield* self.run(
          makeSink(sink.onFailure, (a: A) =>
            Effect.gen(function* () {
              const nextLength = yield* Ref.modify(buffer, (current) => {
                current.push(a);
                return [current.length, current];
              });
              if (nextLength === 1) {
                yield* arm;
              }
              if (nextLength >= size) {
                yield* flushNow;
              }
            }),
          ),
        );

        yield* flushNow;
      }, extendScope),
    );
  },
);

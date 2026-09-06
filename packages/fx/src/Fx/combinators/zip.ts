import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Queue from "effect/Queue";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { map } from "./map.js";
import { tuple } from "./tuple.js";

/**
 * Zips two Fx streams in strict lockstep: emits a pair `[a, b]` only when both
 * streams have produced their next value. Emits the i-th pair when both have
 * produced at least i values.
 *
 * **Completion:** The zipped stream completes when the **first** of the two
 * streams completes (no further pairs are emitted). The other stream is
 * interrupted.
 *
 * **Errors:** The first failure from either stream fails the zipped stream.
 *
 * @remarks
 * ## Why
 * `zip` preserves one-to-one positional correspondence between two producers. Values wait in
 * unbounded queues until their counterpart arrives, and pairs emit in each source's order.
 *
 * ## Ownership and lifetime
 * Both child runs and queues belong to the consumer. The first completion, any failure, or
 * interruption stops both fibers and discards unmatched queued values.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const pairs = Fx.zip(Fx.fromIterable([1, 2]), Fx.fromIterable(["a", "b"]))
 * ```
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits pairs `[A, B]`.
 * @since 1.0.0
 * @category Combining sources
 */
export const zip: {
  <A2, E2, R2>(
    that: Fx<A2, E2, R2>,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<readonly [A, A2], E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    that: Fx<A2, E2, R2>,
  ): Fx<readonly [A, A2], E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    that: Fx<A2, E2, R2>,
  ): Fx<readonly [A, A2], E | E2, R | R2> =>
    make<readonly [A, A2], E | E2, R | R2>((sink) =>
      Effect.gen(function* () {
        const leftQueue = yield* Queue.unbounded<Option.Option<A>>();
        const rightQueue = yield* Queue.unbounded<Option.Option<A2>>();

        const leftSink = makeSink(sink.onFailure, (a: A) => Queue.offer(leftQueue, Option.some(a)));
        const rightSink = makeSink(sink.onFailure, (b: A2) =>
          Queue.offer(rightQueue, Option.some(b)),
        );

        const runLeft = self
          .run(leftSink)
          .pipe(Effect.ensuring(Queue.offer(leftQueue, Option.none())));
        const runRight = that
          .run(rightSink)
          .pipe(Effect.ensuring(Queue.offer(rightQueue, Option.none())));

        const consumer = Effect.gen(function* () {
          while (true) {
            const exitA = yield* Effect.exit(Queue.take(leftQueue));
            if (Exit.isFailure(exitA)) return;
            if (Option.isNone(exitA.value)) return;
            const exitB = yield* Effect.exit(Queue.take(rightQueue));
            if (Exit.isFailure(exitB)) return;
            if (Option.isNone(exitB.value)) return;
            yield* sink.onSuccess([exitA.value.value, exitB.value.value] as const);
          }
        });

        const leftFiber = yield* Effect.forkChild(runLeft);
        const rightFiber = yield* Effect.forkChild(runRight);
        yield* consumer.pipe(
          Effect.ensuring(Fiber.interrupt(leftFiber)),
          Effect.ensuring(Fiber.interrupt(rightFiber)),
        );
      }),
    ),
);

/**
 * Zips two Fx streams in strict lockstep and combines each pair with a function.
 * Emits `f(a, b)` when both streams have produced their next value.
 *
 * **Completion:** Completes when the **first** of the two streams completes.
 * **Errors:** The first failure from either stream fails the result.
 *
 * @remarks
 * ## Why
 * `zipWith` combines each strict pair immediately, preserving `zip`'s lockstep cardinality and
 * ordering while avoiding a separate tuple mapping step.
 *
 * ## Ownership and lifetime
 * It inherits `zip`'s two child runs and unbounded unmatched-value queues. The pure combiner adds no
 * resource, error, or service requirement.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const sums = Fx.zipWith(Fx.fromIterable([1]), Fx.fromIterable([2]), (a, b) => a + b)
 * ```
 *
 * @param that - The second Fx stream.
 * @param f - Function to combine the pair `(a, b)` into a single value.
 * @returns An Fx that emits combined values.
 * @since 1.0.0
 * @category Combining sources
 */
export const zipWith: {
  <A, A2, E2, R2, B>(
    that: Fx<A2, E2, R2>,
    f: (a: A, b: A2) => B,
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2, R | R2>;
  <A, E, R, A2, E2, R2, B>(
    self: Fx<A, E, R>,
    that: Fx<A2, E2, R2>,
    f: (a: A, b: A2) => B,
  ): Fx<B, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, A2, E2, R2, B>(
    self: Fx<A, E, R>,
    that: Fx<A2, E2, R2>,
    f: (a: A, b: A2) => B,
  ): Fx<B, E | E2, R | R2> => map(zip(self, that), (pair) => f(pair[0], pair[1])),
);

/**
 * Zips two Fx streams by latest values: waits for both to emit at least once,
 * then emits `[left, right]` whenever **either** stream emits (using the latest
 * value from the other). No strict pairing; output count is the sum of
 * emissions from both after the first pair.
 *
 * **Completion:** Completes when **both** streams have completed.
 * **Errors:** The first failure from either stream fails the result.
 *
 * @remarks
 * ## Why
 * `zipLatest` combines independent sources as state: after both initialize, either update emits one
 * pair containing both latest values. It does not enforce one-to-one pairing.
 *
 * ## Ownership and lifetime
 * It delegates to `tuple`: both sources run concurrently and retain one latest value each until
 * both complete or the consumer is interrupted.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const latest = Fx.zipLatest(Fx.succeed(1), Fx.succeed("ready"))
 * ```
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits `[AL, AR]` on every update from either stream.
 * @since 1.0.0
 * @category Combining sources
 */
export const zipLatest: {
  <AR, ER, RR>(
    that: Fx<AR, ER, RR>,
  ): <AL, EL, RL>(self: Fx<AL, EL, RL>) => Fx<readonly [AL, AR], EL | ER, RL | RR>;
  <AL, EL, RL, AR, ER, RR>(
    self: Fx<AL, EL, RL>,
    that: Fx<AR, ER, RR>,
  ): Fx<readonly [AL, AR], EL | ER, RL | RR>;
} = dual(
  2,
  <AL, EL, RL, AR, ER, RR>(
    self: Fx<AL, EL, RL>,
    that: Fx<AR, ER, RR>,
  ): Fx<readonly [AL, AR], EL | ER, RL | RR> => tuple(self, that),
);

/**
 * Zips two Fx streams by latest values and combines each pair with a function.
 * Waits for both to emit at least once, then emits `f(left, right)` whenever
 * either stream emits.
 *
 * **Completion:** Completes when **both** streams have completed.
 * **Errors:** The first failure from either stream fails the result.
 *
 * @remarks
 * ## Why
 * `zipLatestWith` projects latest-value pairs whenever either initialized source updates. The
 * synchronous callback changes payloads without changing `zipLatest` cardinality.
 *
 * ## Ownership and lifetime
 * Both concurrent sources and their retained latest values are owned by the consumer. The combiner
 * is pure; failure, services, completion, and interruption come from the inputs.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const label = Fx.zipLatestWith(Fx.succeed(1), Fx.succeed("item"), (n, kind) => `${kind}-${n}`)
 * ```
 *
 * @param that - The second Fx stream.
 * @param f - Function to combine the latest `(left, right)` into a single value.
 * @returns An Fx that emits combined values.
 * @since 1.0.0
 * @category Combining sources
 */
export const zipLatestWith: {
  <AL, AR, ER, RR, B>(
    that: Fx<AR, ER, RR>,
    f: (left: AL, right: AR) => B,
  ): <EL, RL>(self: Fx<AL, EL, RL>) => Fx<B, EL | ER, RL | RR>;
  <AL, EL, RL, AR, ER, RR, B>(
    self: Fx<AL, EL, RL>,
    that: Fx<AR, ER, RR>,
    f: (left: AL, right: AR) => B,
  ): Fx<B, EL | ER, RL | RR>;
} = dual(
  3,
  <AL, EL, RL, AR, ER, RR, B>(
    self: Fx<AL, EL, RL>,
    that: Fx<AR, ER, RR>,
    f: (left: AL, right: AR) => B,
  ): Fx<B, EL | ER, RL | RR> => map(zipLatest(self, that), (pair) => f(pair[0], pair[1])),
);

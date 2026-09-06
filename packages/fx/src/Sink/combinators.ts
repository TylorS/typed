import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Semaphore from "effect/Semaphore";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import { dual, flow, identity } from "effect/Function";
import * as MutableRef from "effect/MutableRef";
import * as Option from "effect/Option";
import type { Predicate } from "effect/Predicate";
import * as Ref from "effect/Ref";
import type { Scheduler } from "effect/Scheduler";
import type { Sink } from "./Sink.js";

class MapSink<A, E, R, B> implements Sink<B, E, R> {
  readonly sink: Sink<A, E, R>;
  readonly f: (b: B) => A;

  constructor(sink: Sink<A, E, R>, f: (b: B) => A) {
    this.sink = sink;
    this.f = f;
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  onSuccess(value: B): Effect.Effect<unknown, never, R> {
    return this.sink.onSuccess(this.f(value));
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  static make<A, E, R, B>(sink: Sink<A, E, R>, f: (b: B) => A): Sink<B, E, R> {
    if (sink instanceof MapSink) {
      return new MapSink(sink.sink, flow(f, sink.f));
    }

    if (sink instanceof FilterMapSink) {
      return new FilterMapSink(sink.sink, flow(f, sink.f));
    }

    return new MapSink(sink, f);
  }
}

/**
 * Transforms values before they reach the sink using a pure function.
 *
 * @remarks
 * ## Why
 * Contramapping adapts a consumer to a new input without changing the producer or allocating an
 * intermediate Fx.
 *
 * ## Ownership and lifetime
 * Mapping is synchronous, preserves one-for-one input order, and acquires no resources. Thrown
 * exceptions are defects. The wrapped sink still owns its callback effects and service needs.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const sink = Sink.make(
 *     (cause) => Effect.void,
 *     (value: number) => Effect.sync(() => console.log("Received:", value))
 *   )
 *
 *   // Map string inputs to numbers
 *   const mapped = Sink.map(sink, (str: string) => parseInt(str))
 *
 *   // Run an Fx with the mapped sink
 *   yield* Fx.fromIterable(["1", "2", "3"]).run(mapped)
 *   // Output: "Received: 1", "Received: 2", "Received: 3"
 * })
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export function map<A, E, R, B>(sink: Sink<A, E, R>, f: (b: B) => A): Sink<B, E, R> {
  return MapSink.make(sink, f);
}

/**
 * Alias for `map`, named for the input-side direction of the transformation.
 *
 * @remarks
 * ## Why
 * `mapInput` makes contravariant Sink pipelines easier to read beside output-mapping APIs.
 *
 * ## Ownership and lifetime
 * It is exactly `map`: synchronous, one-for-one, ordered, and resource-free.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const numbers = Sink.make(Effect.logError, (value: number) => Effect.log(value))
 * const strings = Sink.mapInput(numbers, Number)
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export const mapInput = map;

/**
 * Maps the error channel of a sink using the provided function.
 * Failures are mapped via `Cause.map`; defects and interrupts are preserved.
 *
 * @remarks
 * ## Why
 * A producer's typed error can be translated into the vocabulary expected by an existing consumer
 * without losing Cause structure.
 *
 * ## Ownership and lifetime
 * Mapping is synchronous and resource-free. Success order is unchanged; only `Fail` reasons are
 * mapped, while defects and interruption reasons pass through untouched.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target: Sink.Sink<number, string> = Sink.make(Effect.logError, Effect.log)
 * const acceptsNumbers = Sink.mapError(target, (error: number) => `code:${error}`)
 * ```
 *
 * @since 1.0.0
 * @category Failure handling
 */
export function mapError<A, E, E2, R>(sink: Sink<A, E2, R>, f: (e: E) => E2): Sink<A, E, R> {
  return new MapErrorSink(sink, f);
}

class MapErrorSink<A, E, E2, R> implements Sink<A, E, R> {
  readonly sink: Sink<A, E2, R>;
  readonly f: (e: E) => E2;

  constructor(sink: Sink<A, E2, R>, f: (e: E) => E2) {
    this.sink = sink;
    this.f = f;
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  onSuccess(value: A): Effect.Effect<unknown, never, R> {
    return this.sink.onSuccess(value);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(Cause.map(cause, this.f));
  }
}

class FilterMapSink<A, E, R, B> implements Sink<B, E, R> {
  readonly sink: Sink<A, E, R>;
  readonly f: (b: B) => Option.Option<A>;

  constructor(sink: Sink<A, E, R>, f: (b: B) => Option.Option<A>) {
    this.sink = sink;
    this.f = f;
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  onSuccess(value: B): Effect.Effect<unknown, never, R> {
    const a = this.f(value);
    return Option.match(a, {
      onSome: (a) => this.sink.onSuccess(a),
      onNone: () => Effect.void,
    });
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  static make<A, E, R, B>(sink: Sink<A, E, R>, f: (b: B) => Option.Option<A>): Sink<B, E, R> {
    if (sink instanceof FilterMapSink) {
      return new FilterMapSink(sink.sink, flow(f, Option.flatMap(sink.f)));
    }

    if (sink instanceof MapSink) {
      return new FilterMapSink(sink.sink, flow(f, Option.map(sink.f)));
    }

    return new FilterMapSink(sink, f);
  }
}

/**
 * Filters and transforms values before they reach the sink using a function that returns an `Option`.
 *
 * @remarks
 * ## Why
 * Selection and transformation happen at the consumer boundary without constructing another Fx.
 *
 * ## Ownership and lifetime
 * Inputs are inspected synchronously in arrival order. `Some` invokes the wrapped sink once;
 * `None` invokes it zero times. The adapter acquires no resources and failures pass through.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const sink = Sink.make(
 *     (cause) => Effect.void,
 *     (value: number) => Effect.sync(() => console.log("Even:", value))
 *   )
 *
 *   // Only pass through even numbers
 *   const filtered = Sink.filterMap(sink, (n: number) =>
 *     n % 2 === 0 ? Option.some(n) : Option.none()
 *   )
 *
 *   yield* Fx.fromIterable([1, 2, 3, 4, 5]).run(filtered)
 *   // Output: "Even: 2", "Even: 4"
 * })
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export function filterMap<A, E, R, B>(
  sink: Sink<A, E, R>,
  f: (b: B) => Option.Option<A>,
): Sink<B, E, R> {
  return FilterMapSink.make(sink, f);
}

/**
 * Forwards `Some` values and discards `None` values.
 *
 * @remarks
 * ## Why
 * `compact` consumes optional producer output with the same zero-or-one cardinality as `filterMap`.
 *
 * ## Ownership and lifetime
 * Option inspection is synchronous and resource-free. Present values retain arrival order; failure
 * causes pass through unchanged.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const sink = Sink.compact(Sink.make(Effect.logError, (n: number) => Effect.log(n)))
 * sink.onSuccess(Option.some(1))
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export function compact<A, E, R>(sink: Sink<A, E, R>): Sink<Option.Option<A>, E, R> {
  return filterMap(sink, identity);
}

/**
 * Filters values before they reach the sink using a predicate function.
 *
 * @remarks
 * ## Why
 * Predicate filtering narrows consumer traffic without changing the producer.
 *
 * ## Ownership and lifetime
 * The predicate runs synchronously in arrival order. Matching values invoke the wrapped sink once;
 * non-matches invoke it zero times. The adapter acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const sink = Sink.make(
 *     (cause) => Effect.void,
 *     (value: number) => Effect.sync(() => console.log("Positive:", value))
 *   )
 *
 *   // Only pass through positive numbers
 *   const filtered = Sink.filter(sink, (n) => n > 0)
 *
 *   yield* Fx.fromIterable([-2, -1, 0, 1, 2]).run(filtered)
 *   // Output: "Positive: 1", "Positive: 2"
 * })
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export function filter<A, E, R>(sink: Sink<A, E, R>, f: (a: A) => boolean): Sink<A, E, R> {
  return filterMap(sink, Option.liftPredicate(f));
}

/**
 * Runs a producer-style callback with a sink that can complete the surrounding Effect early.
 *
 * @remarks
 * ## Why
 * Consumer combinators can stop upstream work after a bound or predicate without representing
 * normal completion as failure.
 *
 * ## Ownership and lifetime
 * The returned Effect owns the callback fiber. Completion, `earlyExit`, or interruption aborts that
 * fiber through the supplied signal; deliveries after exit are ignored. The callback's services are
 * combined with the wrapped sink's services.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const base = Sink.make(Effect.logError, Effect.log)
 * const program = Sink.withEarlyExit(base, (sink) => sink.onSuccess("done").pipe(Effect.andThen(sink.earlyExit)))
 * ```
 *
 * @since 1.0.0
 * @category Stopping delivery
 */
export function withEarlyExit<A, E, R, R2>(
  sink: Sink<A, E, R>,
  f: (
    sink: Sink.WithEarlyExit<A, E, R>,
    params: { signal: AbortSignal; scheduler: Scheduler },
  ) => Effect.Effect<unknown, never, R2>,
): Effect.Effect<void, never, R | R2> {
  return Effect.contextWith((services) =>
    Effect.callback<unknown, never, R2>(function (this: Scheduler, resume, signal) {
      let exited = false;
      let exitRequested = false;
      let resumed = false;
      let producerFiber: Fiber.Fiber<unknown, never> | undefined;
      const finish = () => {
        if (resumed || producerFiber === undefined) return;
        resumed = true;
        resume(Fiber.interrupt(producerFiber));
      };
      const earlyExit = Effect.sync<void>(() => {
        if (exited) return;
        exited = true;
        exitRequested = true;
        finish();
      });
      const onSuccess = (a: A) => {
        if (exited) return Effect.void;
        return sink.onSuccess(a);
      };
      const onFailure = (cause: Cause.Cause<E>) => {
        if (exited) return Effect.void;
        return sink.onFailure(cause);
      };
      const sinkWithEarlyExit: Sink.WithEarlyExit<A, E, R> = {
        onSuccess,
        onFailure,
        earlyExit,
      };

      producerFiber = f(sinkWithEarlyExit, { signal, scheduler: this }).pipe(
        Effect.flatMap(() => earlyExit),
        (_) => Effect.runForkWith(services)(_, { scheduler: this, signal }),
      );
      if (exitRequested) finish();
    }),
  );
}

/**
 * Runs a callback with an early-exit sink and a private Effect `Ref` initialized to `state`.
 *
 * @remarks
 * ## Why
 * It supports stateful consumer protocols while keeping their state local to one run.
 *
 * ## Ownership and lifetime
 * Each execution creates one Ref and owns it until exit or interruption. Ref operations are lazy
 * atomic Effects: serialized callback execution preserves producer order, while concurrent execution
 * is ordered by scheduling. No state is shared across `withState` executions.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const base = Sink.make(Effect.logError, Effect.log)
 * const program = Sink.withState(base, 0, ({ state, earlyExit }) => Ref.set(state, 1).pipe(Effect.andThen(earlyExit)))
 * ```
 *
 * @since 1.0.0
 * @category Stateful delivery
 */
export function withState<A, E, R, B, R2>(
  sink: Sink<A, E, R>,
  state: B,
  f: (
    sink: Sink.WithState<A, E, R, B>,
    params: { signal: AbortSignal; scheduler: Scheduler },
  ) => Effect.Effect<unknown, never, R2>,
) {
  return withEarlyExit(sink, (sink, params) =>
    f({ ...sink, state: Ref.makeUnsafe(state) }, params),
  );
}

/**
 * Runs a callback with private state whose effectful reads and writes are serialized.
 *
 * @remarks
 * ## Why
 * Overlapping asynchronous callbacks need a lock to prevent multiple updates from reading the same
 * prior state.
 *
 * ## Ownership and lifetime
 * Each execution owns one mutable cell and one single-permit semaphore. Modify Effects serialize in
 * semaphore-acquisition order, release the permit on completion or interruption, and expose their
 * typed errors and services. Constructing an Effect does not acquire the permit; running it does.
 * Exit aborts the surrounding callback fiber.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const base = Sink.make(Effect.logError, Effect.log)
 * const program = Sink.withStateSemaphore(base, 0, (state) =>
 *   state.updateEffect((n) => Effect.succeed(n + 1)).pipe(Effect.andThen(state.earlyExit)))
 * ```
 *
 * @since 1.0.0
 * @category Stateful delivery
 */
export function withStateSemaphore<A, E, R, B, R2>(
  sink: Sink<A, E, R>,
  state: B,
  f: (
    sink: Sink.WithStateSemaphore<A, E, R, B>,
    params: { signal: AbortSignal; scheduler: Scheduler },
  ) => Effect.Effect<unknown, never, R2>,
) {
  return withEarlyExit(sink, (sink, params) => {
    const stateRef = MutableRef.make(state);
    const semaphore = Semaphore.makeUnsafe(1);
    const lock = semaphore.withPermits(1);
    const modifyEffect = <C, E2, R2>(f: (state: B) => Effect.Effect<readonly [C, B], E2, R2>) =>
      Effect.suspend(() => f(MutableRef.get(stateRef))).pipe(
        Effect.flatMap(([c, b]) => {
          MutableRef.set(stateRef, b);
          return Effect.succeed(c);
        }),
        lock,
      );
    const updateEffect = <E2, R2>(f: (state: B) => Effect.Effect<B, E2, R2>) =>
      modifyEffect((state) => f(state).pipe(Effect.map((b) => [b, b])));
    const get = modifyEffect((state) => Effect.succeed([state, state]));

    return f({ ...sink, modifyEffect, updateEffect, get }, params);
  });
}

/**
 * Threads pure state through successful inputs and forwards one derived value per input.
 *
 * @remarks
 * ## Why
 * `loop` implements an ordered consumer-side state machine without exposing mutable state to the
 * producer.
 *
 * ## Ownership and lifetime
 * Each adapted sink owns its seed. Updates are synchronous and follow callback invocation order;
 * every input produces exactly one downstream success. Failures bypass the state machine. Reusing
 * the same sink for another producer run continues from its retained seed; create a new sink to reset.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const totals = Sink.loop(Sink.make(Effect.logError, Effect.log), 0, (sum, n: number) => [sum + n, sum + n])
 * ```
 *
 * @since 1.0.0
 * @category Stateful delivery
 */
export const loop: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: A) => readonly [C, B],
  ): <E, R>(sink: Sink<C, E, R>) => Sink<A, E, R>;
  <A, E, R, B, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => readonly [C, B],
  ): Sink<A, E, R>;
} = dual(3, function loop<
  A,
  E,
  R,
  B,
  C,
>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Sink<A, E, R> {
  return new LoopSink(sink, seed, f);
});

class LoopSink<A, E, R, B, C> implements Sink<A, E, R> {
  readonly sink: Sink<C, E, R>;
  private seed: B;
  readonly f: (acc: B, a: A) => readonly [C, B];

  constructor(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    const [c, acc] = this.f(this.seed, value);
    this.seed = acc;
    return this.sink.onSuccess(c);
  }
}

/**
 * Threads pure state through failure causes and forwards one transformed cause per failure.
 *
 * @remarks
 * ## Why
 * Stateful error translation can retain retry or protocol context while preserving full Cause
 * information.
 *
 * ## Ownership and lifetime
 * Each adapted sink owns its seed. Failure callbacks update it synchronously in invocation order;
 * successes pass through unchanged. Reusing the sink continues from its retained seed; create a new
 * sink to reset. No resources are acquired.
 *
 * @example
 * ```ts
 * import { Cause, Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target: Sink.Sink<number, string> = Sink.make(Effect.logError, Effect.log)
 * const counted = Sink.loopCause(target, 0, (n, cause: Cause.Cause<string>) => [cause, n + 1])
 * ```
 *
 * @since 1.0.0
 * @category Stateful failure handling
 */
export const loopCause: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => readonly [Cause.Cause<C>, B],
  ): <E, R>(sink: Sink<A, C, R>) => Sink<A, E, R>;
  <A, E, R, B, C>(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B],
  ): Sink<A, E, R>;
} = dual(3, function loopCause<
  A,
  E,
  R,
  B,
  C,
>(sink: Sink<A, C, R>, seed: B, f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]): Sink<
  A,
  E,
  R
> {
  return new LoopCauseSink(sink, seed, f);
});

class LoopCauseSink<A, E, R, B, C> implements Sink<A, E, R> {
  readonly sink: Sink<A, C, R>;
  private seed: B;
  readonly f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B];

  constructor(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B],
  ) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    const [c, acc] = this.f(this.seed, cause);
    this.seed = acc;
    return this.sink.onFailure(c);
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value);
  }
}

/**
 * Threads pure state through successes and optionally forwards a derived value.
 *
 * @remarks
 * ## Why
 * It combines consumer-side state, filtering, and mapping in one ordered transition.
 *
 * ## Ownership and lifetime
 * Each adapted sink owns its seed. Every input updates state synchronously; `Some` emits once and
 * `None` emits nothing. Failures pass through. Reusing the sink continues from its retained seed;
 * create a new sink to reset. The adapter acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target = Sink.make(Effect.logError, Effect.log)
 * const everyOther = Sink.filterMapLoop(target, false, (skip, n: number) => [skip ? Option.none() : Option.some(n), !skip])
 * ```
 *
 * @since 1.0.0
 * @category Stateful delivery
 */
export const filterMapLoop: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: A) => readonly [Option.Option<C>, B],
  ): <E, R>(sink: Sink<C, E, R>) => Sink<A, E, R>;
  <A, E, R, B, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => readonly [Option.Option<C>, B],
  ): Sink<A, E, R>;
} = dual(3, function filterMapLoop<
  A,
  E,
  R,
  B,
  C,
>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Sink<
  A,
  E,
  R
> {
  return new FilterMapLoopSink(sink, seed, f);
});

class FilterMapLoopSink<A, E, R, B, C> implements Sink<A, E, R> {
  readonly sink: Sink<C, E, R>;
  private seed: B;
  readonly f: (acc: B, a: A) => readonly [Option.Option<C>, B];

  constructor(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    const [option, acc] = this.f(this.seed, value);
    this.seed = acc;
    if (Option.isSome(option)) return this.sink.onSuccess(option.value);
    return Effect.void;
  }
}

/**
 * Threads pure state through failures and optionally forwards a transformed cause.
 *
 * @remarks
 * ## Why
 * Stateful failure suppression and translation can be expressed without discarding Cause structure.
 *
 * ## Ownership and lifetime
 * Each adapted sink owns its seed. Failure callbacks update state synchronously in invocation order;
 * `Some` forwards once and `None` suppresses the failure. Successes pass through unchanged. Reusing
 * the sink continues from its retained seed; create a new sink to reset.
 *
 * @example
 * ```ts
 * import { Cause, Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target: Sink.Sink<number, string> = Sink.make(Effect.logError, Effect.log)
 * const first = Sink.filterMapLoopCause(target, true, (keep, cause: Cause.Cause<string>) => [keep ? Option.some(cause) : Option.none(), false])
 * ```
 *
 * @since 1.0.0
 * @category Stateful failure handling
 */
export const filterMapLoopCause: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => readonly [Option.Option<Cause.Cause<C>>, B],
  ): <E, R>(sink: Sink<A, C, R>) => Sink<A, E, R>;
  <A, E, R, B, C>(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B],
  ): Sink<A, E, R>;
} = dual(3, function filterMapLoopCause<
  A,
  E,
  R,
  B,
  C,
>(sink: Sink<A, C, R>, seed: B, f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]): Sink<
  A,
  E,
  R
> {
  return new FilterMapLoopCauseSink(sink, seed, f);
});

class FilterMapLoopCauseSink<A, E, R, B, C> implements Sink<A, E, R> {
  readonly sink: Sink<A, C, R>;
  private seed: B;
  readonly f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B];

  constructor(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B],
  ) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    const [option, acc] = this.f(this.seed, cause);
    this.seed = acc;
    if (Option.isSome(option)) return this.sink.onFailure(option.value);
    return Effect.void;
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value);
  }
}

/**
 * Threads state through an effectful success transformation and forwards one value on success.
 *
 * @remarks
 * ## Why
 * Stateful consumer transitions can consult Effect services or fail without moving the state
 * machine into the producer.
 *
 * ## Ownership and lifetime
 * Callback invocation constructs a transition Effect from the seed visible at that moment. The
 * adapter does not serialize those Effects: overlapping callbacks can read the same seed, and
 * successful transitions commit in completion order. A failure is sent to the wrapped sink and does
 * not commit. The sink instance retains its last committed seed when reused by another producer run;
 * construct a new adapted sink to reset it. Transition services and interruption remain typed.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target = Sink.make(Effect.logError, Effect.log)
 * const totals = Sink.loopEffect(target, 0, (sum, n: number) => Effect.succeed([sum + n, sum + n] as const))
 * ```
 *
 * @since 1.0.0
 * @category Stateful delivery
 */
export const loopEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>,
  ): <E, R>(sink: Sink<C, E | E2, R>) => Sink<A, E | E2, R | R2>;
  <A, E, R, B, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>,
  ): Sink<A, E, R>;
} = dual(3, function loopEffect<
  A,
  E,
  R,
  B,
  C,
>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>): Sink<
  A,
  E,
  R
> {
  return new LoopEffectSink(sink, seed, f);
});

class LoopEffectSink<A, E, R, B, C> implements Sink<A, E, R> {
  readonly sink: Sink<C, E, R>;
  private seed: B;
  readonly f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>;

  constructor(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>,
  ) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(this.seed, value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: ([c, acc]) => {
        this.seed = acc;
        return this.sink.onSuccess(c);
      },
    });
  }
}

/**
 * Threads state through an effectful success transition and optionally forwards its value.
 *
 * @remarks
 * ## Why
 * One transition can perform service-backed work, update state, and decide whether the consumer
 * should observe a value.
 *
 * ## Ownership and lifetime
 * Callback invocation constructs a transition Effect from the seed visible at that moment. The
 * adapter does not serialize those Effects: overlapping callbacks can read the same seed, and
 * successful transitions commit in completion order. `Some` then invokes the wrapped sink once,
 * `None` not at all, and failure invokes its failure callback without committing. The sink instance
 * retains its seed across producer runs; construct a new one to reset it.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target = Sink.make(Effect.logError, Effect.log)
 * const sink = Sink.filterMapLoopEffect(target, 0, (count, n: number) => Effect.succeed([Option.some(n), count + 1] as const))
 * ```
 *
 * @since 1.0.0
 * @category Stateful delivery
 */
export const filterMapLoopEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>,
  ): <E, R>(sink: Sink<C, E, R>) => Sink<A, E | E2, R | R2>;
  <A, E, R, B, R2, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>,
  ): Sink<A, E, R | R2>;
} = dual(3, function filterMapLoopEffect<
  A,
  E,
  R,
  B,
  R2,
  C,
>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>): Sink<
  A,
  E,
  R | R2
> {
  return new FilterMapLoopEffectSink(sink, seed, f);
});

class FilterMapLoopEffectSink<A, E, R, B, R2, C> implements Sink<A, E, R | R2> {
  readonly sink: Sink<C, E, R>;
  private seed: B;
  readonly f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>;

  constructor(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>,
  ) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(this.seed, value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: ([option, acc]) => {
        this.seed = acc;
        if (Option.isSome(option)) return this.sink.onSuccess(option.value);
        return Effect.void;
      },
    });
  }
}

/**
 * Threads state through an effectful failure transformation.
 *
 * @remarks
 * ## Why
 * Failure handling can consult services and retain state while preserving the original Cause when
 * the handler itself fails.
 *
 * ## Ownership and lifetime
 * Callback invocation constructs a transition Effect from the seed visible at that moment. The
 * adapter does not serialize those Effects: overlapping failures can read the same seed, and
 * successful transitions commit in completion order. A transition failure is combined with the
 * original cause and does not commit. Success values bypass the state machine. The sink instance
 * retains its seed across producer runs; construct a new one to reset it.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target = Sink.make(Effect.logError, Effect.log)
 * const sink = Sink.loopCauseEffect(target, 0, (count, cause) => Effect.succeed([cause, count + 1] as const))
 * ```
 *
 * @since 1.0.0
 * @category Stateful failure handling
 */
export const loopCauseEffect: {
  <A, E, R2, B, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R2>,
  ): <R>(sink: Sink<A, E | C, R>) => Sink<A, E, R | R2>;

  <A, E, R, B, C, R2>(
    sink: Sink<A, E | C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R2>,
  ): Sink<A, E, R | R2>;
} = dual(3, function loopCauseEffect<
  A,
  E,
  R,
  B,
  C,
  R2,
>(sink: Sink<A, E | C, R>, seed: B, f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R2>): Sink<
  A,
  E,
  R | R2
> {
  return new LoopCauseEffectSink<A, E, R | R2, B, C>(sink, seed, f);
});

class LoopCauseEffectSink<A, E, R, B, C> implements Sink<A, E, R> {
  readonly sink: Sink<A, E | C, R>;
  private seed: B;
  readonly f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R>;

  constructor(
    sink: Sink<A, E | C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R>,
  ) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return Effect.matchCauseEffect(this.f(this.seed, cause), {
      onFailure: (cause2) =>
        this.sink.onFailure(Cause.fromReasons([...cause.reasons, ...cause2.reasons])),
      onSuccess: ([c, acc]) => {
        this.seed = acc;
        return this.sink.onFailure(c);
      },
    });
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value);
  }
}

/**
 * Threads state through an effectful failure transition and optionally forwards a cause.
 *
 * @remarks
 * ## Why
 * It supports service-backed, stateful failure suppression or translation at the consumer boundary.
 *
 * ## Ownership and lifetime
 * Callback invocation constructs a transition Effect from the seed visible at that moment. The
 * adapter does not serialize those Effects: overlapping failures can read the same seed, and
 * successful transitions commit in completion order. `Some` forwards one cause, `None` suppresses
 * it, and transition failure is forwarded without committing. Successes pass through. The sink
 * instance retains its seed across producer runs; construct a new one to reset it.
 *
 * @example
 * ```ts
 * import { Cause, Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target: Sink.Sink<number, string> = Sink.make(Effect.logError, Effect.log)
 * const sink = Sink.filterMapLoopCauseEffect(target, false, (seen, cause: Cause.Cause<string>) =>
 *   Effect.succeed([seen ? Option.none() : Option.some(cause), true] as const))
 * ```
 *
 * @since 1.0.0
 * @category Stateful failure handling
 */
export function filterMapLoopCauseEffect<A, E, R, B, E2, R2, C>(
  sink: Sink<A, E2 | C, R>,
  seed: B,
  f: (
    acc: B,
    a: Cause.Cause<E>,
  ) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>,
): Sink<A, E, R | R2> {
  return new FilterMapLoopCauseEffectSink(sink, seed, f);
}

class FilterMapLoopCauseEffectSink<A, E, R, B, E2, R2, C> implements Sink<A, E, R | R2> {
  readonly sink: Sink<A, E2 | C, R>;
  private seed: B;
  readonly f: (
    acc: B,
    a: Cause.Cause<E>,
  ) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>;

  constructor(
    sink: Sink<A, E2 | C, R>,
    seed: B,
    f: (
      acc: B,
      a: Cause.Cause<E>,
    ) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>,
  ) {
    this.sink = sink;
    this.seed = seed;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R | R2> {
    return Effect.matchCauseEffect(this.f(this.seed, cause), {
      onFailure: (cause2) => this.sink.onFailure(cause2),
      onSuccess: ([option, acc]) => {
        this.seed = acc;
        if (Option.isSome(option)) return this.sink.onFailure(option.value);
        return Effect.void;
      },
    });
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value);
  }
}

/**
 * Zero-based skip count and maximum take count used by `slice`.
 *
 * @remarks
 * ## Why
 * A named bound makes the consumer's two independent limits explicit.
 *
 * ## Ownership and lifetime
 * Bounds are immutable values and acquire no resources. Each `slice` execution copies their counts
 * into private mutable counters.
 *
 * @example
 * ```ts
 * import type { Bounds } from "@typed/fx/Sink"
 * const secondAndThird: Bounds = { skip: 1, take: 2 }
 * ```
 *
 * @since 1.0.0
 * @category Operator options
 */
export interface Bounds {
  /**
   * Number of initial successful values to discard.
   *
   * @remarks
   * ## Why
   * A separate skip count allows bounded windows to begin after an ignored prefix.
   *
   * ## Ownership and lifetime
   * This immutable number acquires no resources; `slice` copies it into invocation-local state.
   *
   * @since 1.0.0
   * @category bounds
   */
  readonly skip: number;
  /**
   * Maximum number of later successful values to forward before early exit.
   *
   * @remarks
   * ## Why
   * A take count bounds downstream work and gives `slice` its normal completion point.
   *
   * ## Ownership and lifetime
   * This immutable number acquires no resources; `slice` copies it into invocation-local state.
   *
   * @since 1.0.0
   * @category bounds
   */
  readonly take: number;
}

/**
 * Runs a producer callback through a bounded view of a sink.
 *
 * @remarks
 * ## Why
 * Consumers can skip an initial prefix and stop after a fixed number of values, allowing the
 * surrounding producer work to finish early.
 *
 * ## Ownership and lifetime
 * Each execution owns fresh counters and an early-exit callback. Successes remain ordered; at most
 * `take` values are delivered after `skip` values. Failures always pass through. Reaching the bound
 * completes and aborts the callback fiber; negative bounds are not normalized.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target = Sink.make(Effect.logError, Effect.log)
 * const program = Sink.slice(target, { skip: 1, take: 2 }, (bounded) => bounded.onSuccess("kept"))
 * ```
 *
 * @since 1.0.0
 * @category Stopping delivery
 */
export const slice: {
  <A, E, R, R2>(
    bounds: Bounds,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>,
  ): (sink: Sink<A, E, R>) => Effect.Effect<void, never, R | R2>;
  <A, E, R, R2>(
    sink: Sink<A, E, R>,
    bounds: Bounds,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>,
  ): Effect.Effect<void, never, R | R2>;
} = dual(3, function slice<
  A,
  E,
  R,
  R2,
>(sink: Sink<A, E, R>, bounds: Bounds, f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>): Effect.Effect<
  void,
  never,
  R | R2
> {
  return withEarlyExit(sink, (s) => f(new SliceSink(s, bounds)));
});

class SliceSink<A, E, R> implements Sink<A, E, R> {
  private drop: number;
  private take: number;

  readonly sink: Sink.WithEarlyExit<A, E, R>;
  readonly bounds: Bounds;

  constructor(sink: Sink.WithEarlyExit<A, E, R>, bounds: Bounds) {
    this.sink = sink;
    this.bounds = bounds;
    this.drop = this.bounds.skip;
    this.take = this.bounds.take;

    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    if (this.drop > 0) {
      this.drop--;
      return Effect.void;
    }
    if (this.take-- > 0) {
      return Effect.tap(this.sink.onSuccess(value), () =>
        this.take === 0 ? this.sink.earlyExit : Effect.void,
      );
    }
    return this.sink.earlyExit;
  }
}

/**
 * Runs an Effect for each input and forwards its successful value to the sink.
 *
 * @remarks
 * ## Why
 * Consumer-side adaptation can use services and typed failure without creating an intermediate Fx.
 *
 * ## Ownership and lifetime
 * One transition Effect runs per callback invocation. Its success is forwarded once; its complete
 * failure Cause is sent to `onFailure`. Calls themselves are not serialized by this adapter, so
 * ordering follows the invoking producer. Services join the sink requirements; interruption is local
 * to each callback Effect.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const numbers = Sink.mapEffect(Sink.make(Effect.logError, Effect.log), (text: string) =>
 *   Effect.succeed(Number(text)))
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export const mapEffect: {
  <B, A, E2, R2>(
    f: (b: B) => Effect.Effect<A, E2, R2>,
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<B, E | E2, R | R2>;
  <A, E, R, B, E2, R2>(
    sink: Sink<A, E | E2, R>,
    f: (b: B) => Effect.Effect<A, E2, R2>,
  ): Sink<B, E | E2, R | R2>;
} = dual(2, function mapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
>(sink: Sink<A, E | E2, R>, f: (b: B) => Effect.Effect<A, E2, R2>): Sink<B, E | E2, R | R2> {
  return new MapEffectSink(sink, f);
});

class MapEffectSink<A, E, R, B, E2, R2> implements Sink<B, E | E2, R | R2> {
  readonly sink: Sink<A, E | E2, R>;
  readonly f: (b: B) => Effect.Effect<A, E2, R2>;
  constructor(sink: Sink<A, E | E2, R>, f: (b: B) => Effect.Effect<A, E2, R2>) {
    this.sink = sink;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E | E2>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: B) {
    return Effect.matchCauseEffect(this.f(value), this.sink);
  }
}

/**
 * Alias for `mapEffect`, named for the input-side direction of the effectful transformation.
 *
 * @remarks
 * ## Why
 * The name highlights that Sink composition is contravariant in successful input.
 *
 * ## Ownership and lifetime
 * It is exactly `mapEffect`: one Effect per input, with the same failures, services, ordering, and
 * interruption behavior.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const sink = Sink.mapInputEffect(Sink.make(Effect.logError, Effect.log), (n: number) => Effect.succeed(String(n)))
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export const mapInputEffect = mapEffect;

/**
 * Runs an Effect for each input and forwards its optional successful value.
 *
 * @remarks
 * ## Why
 * Service-backed validation, selection, and transformation can happen in one consumer adapter.
 *
 * ## Ownership and lifetime
 * Each input runs one Effect. `Some` invokes the sink once, `None` zero times, and failure is routed
 * as a Cause. Invocation order and concurrency are controlled by the producer; services and
 * interruption remain explicit in the returned sink.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const sink = Sink.filterMapEffect(Sink.make(Effect.logError, Effect.log), (n: number) =>
 *   Effect.succeed(n > 0 ? Option.some(n) : Option.none()))
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export const filterMapEffect: {
  <B, A, E2, R2>(
    f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>,
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<B, E | E2, R | R2>;

  <A, E, R, B, E2, R2>(
    sink: Sink<A, E | E2, R>,
    f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>,
  ): Sink<B, E | E2, R | R2>;
} = dual(2, function filterMapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
>(sink: Sink<A, E | E2, R>, f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>): Sink<
  B,
  E | E2,
  R | R2
> {
  return new FilterMapEffectSink(sink, f);
});

class FilterMapEffectSink<A, E, R, B, E2, R2> implements Sink<B, E | E2, R | R2> {
  readonly sink: Sink<A, E | E2, R>;
  readonly f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>;
  constructor(sink: Sink<A, E | E2, R>, f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>) {
    this.sink = sink;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E | E2>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: B) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: (option) => {
        if (Option.isSome(option)) return this.sink.onSuccess(option.value);
        else return Effect.void;
      },
    });
  }
}

/**
 * Runs an effectful predicate and forwards inputs for which it succeeds with `true`.
 *
 * @remarks
 * ## Why
 * A consumer can filter using service-backed or asynchronous policy without changing the producer.
 *
 * ## Ownership and lifetime
 * Each input runs one predicate Effect. `true` forwards once, `false` not at all, and predicate
 * failure reaches the sink's failure callback. The producer controls callback ordering and
 * concurrency; predicate services and interruption remain typed.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const positive = Sink.filterEffect(Sink.make(Effect.logError, Effect.log), (n: number) => Effect.succeed(n > 0))
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export const filterEffect: {
  <A, E2, R2>(
    f: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<A, E | E2, R | R2>;
  <A, E, R>(sink: Sink<A, E, R>, f: (a: A) => Effect.Effect<boolean, E, R>): Sink<A, E, R>;
} = dual(2, function filterEffect<
  A,
  E,
  R,
  R2,
>(sink: Sink<A, E, R>, f: (a: A) => Effect.Effect<boolean, E, R2>): Sink<A, E, R | R2> {
  return new FilterEffectSink<A, E, R | R2>(sink, f);
});

class FilterEffectSink<A, E, R> implements Sink<A, E, R> {
  readonly sink: Sink<A, E, R>;
  readonly f: (a: A) => Effect.Effect<boolean, E, R>;
  constructor(sink: Sink<A, E, R>, f: (a: A) => Effect.Effect<boolean, E, R>) {
    this.sink = sink;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: (b) => {
        if (b) return this.sink.onSuccess(value);
        else return Effect.void;
      },
    });
  }
}

/**
 * Runs an effectful observation before forwarding each successful input unchanged.
 *
 * @remarks
 * ## Why
 * Logging, metrics, and other observations can be attached at the consumer boundary without
 * changing the value type.
 *
 * ## Ownership and lifetime
 * The tap Effect completes before the value is forwarded. If it fails, its Cause is delivered and
 * the value is not forwarded. The producer controls call order and concurrency; tap services and
 * interruption are reflected by the returned sink.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const observed = Sink.tapEffect(Sink.make(Effect.logError, Effect.log), (n: number) => Effect.log(`saw ${n}`))
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export const tapEffect: {
  <A, E2, R2>(
    f: (a: A) => Effect.Effect<unknown, E2, R2>,
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(
    sink: Sink<A, E | E2, R>,
    f: (a: A) => Effect.Effect<unknown, E2, R2>,
  ): Sink<A, E | E2, R | R2>;
} = dual(2, function tapEffect<
  A,
  E,
  R,
  E2,
  R2,
>(sink: Sink<A, E | E2, R>, f: (a: A) => Effect.Effect<unknown, E2, R2>): Sink<A, E | E2, R | R2> {
  return new TapEffectSink(sink, f);
});

class TapEffectSink<A, E, R, E2, R2> implements Sink<A, E, R | R2> {
  readonly sink: Sink<A, E | E2, R>;
  readonly f: (a: A) => Effect.Effect<unknown, E2, R2>;

  constructor(sink: Sink<A, E | E2, R>, f: (a: A) => Effect.Effect<unknown, E2, R2>) {
    this.sink = sink;
    this.f = f;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: () => this.sink.onSuccess(value),
    });
  }
}

/**
 * Exchanges a sink's typed success and failure channels.
 *
 * @remarks
 * ## Why
 * Error-oriented consumers can be reused as value consumers, and vice versa, without changing the
 * producer-side protocol.
 *
 * ## Ownership and lifetime
 * A successful input becomes `Cause.fail` downstream. For an incoming Cause, the first typed `Fail`
 * reason becomes a success and every remaining reason is discarded, including later failures,
 * defects, or interruption reasons. A Cause with no typed failure passes through intact. The adapter
 * is synchronous, ordered, and resource-free; use `exit` when the whole Cause must remain observable.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const errorsAsValues = Sink.flip(Sink.make(Effect.logError, (value: number) => Effect.log(value)))
 * ```
 *
 * @since 1.0.0
 * @category Failure handling
 */
export const flip = <A, E, R>(sink: Sink<A, E, R>): Sink<E, A, R> => new FlipSink(sink);

class FlipSink<A, E, R> implements Sink<E, A, R> {
  readonly sink: Sink<A, E, R>;
  constructor(sink: Sink<A, E, R>) {
    this.sink = sink;
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  onSuccess(value: E) {
    return this.sink.onFailure(Cause.fail(value));
  }

  onFailure(cause: Cause.Cause<A>) {
    const fail = cause.reasons.find((failure) => failure._tag === "Fail");
    if (!fail) return this.sink.onFailure(cause as Cause.Cause<never>);
    return this.sink.onSuccess(fail.error);
  }
}

/**
 * Materializes both sink channels as successful Effect `Exit` values.
 *
 * @remarks
 * ## Why
 * A single infallible consumer can record or inspect success and the complete failure Cause as data.
 *
 * ## Ownership and lifetime
 * Every input produces exactly one downstream success: `Exit.succeed` for values or
 * `Exit.failCause` for failures. Order is preserved and the adapter acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const exits = Sink.exit(Sink.make(Effect.logError, Effect.log))
 * ```
 *
 * @since 1.0.0
 * @category Failure handling
 */
export const exit = <A, E, R>(sink: Sink<Exit.Exit<A, E>, never, R>) => new ExitSink(sink);

class ExitSink<A, E, R> implements Sink<A, E, R> {
  readonly sink: Sink<Exit.Exit<A, E>, never, R>;
  constructor(sink: Sink<Exit.Exit<A, E>, never, R>) {
    this.sink = sink;
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(Exit.succeed(value));
  }

  onFailure(cause: Cause.Cause<E>) {
    return this.sink.onSuccess(Exit.failCause(cause));
  }
}

/**
 * Runs a producer callback until the first matching value has been forwarded.
 *
 * @remarks
 * ## Why
 * Unlike a filtering operation, `dropAfter` includes the boundary value and then terminates
 * producer work normally.
 *
 * ## Ownership and lifetime
 * Values are forwarded in order through the first predicate match, then early exit completes and
 * aborts the callback fiber. Callback failure is caught and sent to the original sink. The predicate
 * is synchronous; thrown exceptions are defects.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const target = Sink.make(Effect.logError, Effect.log)
 * const program = Sink.dropAfter(target, (n: number) => n >= 10, (limited) => limited.onSuccess(10))
 * ```
 *
 * @since 1.0.0
 * @category Stopping delivery
 */
export const dropAfter: {
  <A, E, R, R2>(
    sink: Sink<A, E, R>,
    predicate: Predicate<A>,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, E, R2>,
  ): Effect.Effect<void, never, R | R2>;
} = dual(3, function dropAfter<
  A,
  E,
  R,
  R2,
>(sink: Sink<A, E, R>, predicate: Predicate<A>, f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, E, R2>): Effect.Effect<
  void,
  never,
  R | R2
> {
  return withEarlyExit(sink, (s) =>
    f(new DropAfterSink(s, predicate)).pipe(Effect.catchCause(sink.onFailure)),
  );
});

class DropAfterSink<A, E, R> implements Sink<A, E, R> {
  readonly sink: Sink.WithEarlyExit<A, E, R>;
  readonly predicate: Predicate<A>;
  constructor(sink: Sink.WithEarlyExit<A, E, R>, predicate: Predicate<A>) {
    this.sink = sink;
    this.predicate = predicate;
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A) {
    if (this.predicate(value)) {
      return Effect.flatMap(this.sink.onSuccess(value), () => this.sink.earlyExit);
    }
    return this.sink.onSuccess(value);
  }
}

/**
 * Suppresses failure causes made entirely of interruption reasons.
 *
 * @remarks
 * ## Why
 * Some terminal consumers treat expected cancellation as silent completion while still needing
 * typed failures and defects.
 *
 * ## Ownership and lifetime
 * Successes pass through unchanged. A pure interruption Cause invokes no downstream callback;
 * mixed or non-interruption causes are preserved. The adapter does not change fiber ownership or
 * cleanup and acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const quietCancellation = Sink.skipInterrupt(Sink.make(Effect.logError, Effect.log))
 * ```
 *
 * @since 1.0.0
 * @category Failure handling
 */
export const skipInterrupt = <A, E, R>(sink: Sink<A, E, R>): Sink<A, E, R> => {
  return {
    onSuccess: (value) => sink.onSuccess(value),
    onFailure: (cause) =>
      cause.reasons.every(Cause.isInterruptReason) ? Effect.void : sink.onFailure(cause),
  };
};

// -----------------------------------------------------------------------------
// Reducing / collecting combinators (additive)
// -----------------------------------------------------------------------------

/**
 * Reduces values into a single result using a pure function. Pass a `Ref<B>`
 * (e.g. from `Ref.make(initial)`); after running, read the result with `Ref.get(ref)`.
 *
 * @remarks
 * ## Why
 * An existing Ref provides an explicit, independently readable result location for consumer-side
 * aggregation.
 *
 * ## Ownership and lifetime
 * The caller owns the Ref. Each success returns a lazy atomic `Ref.update`; invoking `onSuccess`
 * does not update immediately. If the producer executes callback Effects serially, values reduce in
 * that execution order. Concurrent execution is still atomic but may be scheduled in a different
 * order than callback invocation. Failures are ignored and a thrown reducer exception is a defect.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const program = Effect.gen(function* () {
 *   const total = yield* Ref.make(0)
 *   return Sink.reduce(total, (sum, n: number) => sum + n)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Collecting values
 */
export function reduce<A, B, E>(ref: Ref.Ref<B>, f: (b: B, a: A) => B): Sink<A, E, never> {
  return {
    onSuccess: (value) => Ref.update(ref, (b) => f(b, value)),
    onFailure: () => Effect.void,
  };
}

/**
 * Reduces values into a single result using an effectful function. Pass a `Ref<B>`;
 * after running, read the result with `Ref.get(ref)`. If the reducer effect fails,
 * the ref is left unchanged (Sink onSuccess is typed as never failing).
 *
 * @remarks
 * ## Why
 * Aggregation may require Effect services or asynchronous work while the result remains explicitly
 * available through a caller-owned Ref.
 *
 * ## Ownership and lifetime
 * The caller owns the Ref. Each success returns a lazy read/reduce/write Effect; invocation alone does
 * no work. The three steps are not one atomic operation. Serialized producers preserve execution
 * order, while overlapping executions can read the same value and commit in completion order.
 * Reducer failures, producer failures, and interrupted writes are ignored. Use
 * `withStateSemaphore` when the whole effectful transition must be serialized.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const program = Effect.gen(function* () {
 *   const total = yield* Ref.make(0)
 *   return Sink.reduceEffect(total, (sum, n: number) => Effect.succeed(sum + n))
 * })
 * ```
 *
 * @since 1.0.0
 * @category Collecting values
 */
export function reduceEffect<A, B, E, E2, R2>(
  ref: Ref.Ref<B>,
  f: (b: B, a: A) => Effect.Effect<B, E2, R2>,
): Sink<A, E | E2, R2> {
  return {
    onSuccess: (value) =>
      Effect.flatMap(Ref.get(ref), (b) =>
        Effect.matchCauseEffect(f(b, value), {
          onFailure: () => Effect.void,
          onSuccess: (next) => Ref.set(ref, next),
        }),
      ),
    onFailure: () => Effect.void,
  };
}

/**
 * Collects all values into an array. Pass a `Ref<ReadonlyArray<A>>` (e.g. `Ref.make([])`);
 * after running, read the result with `Ref.get(ref)`.
 *
 * @remarks
 * ## Why
 * Collection remains an explicit consumer concern and the accumulated result can be read without
 * changing the producer.
 *
 * ## Ownership and lifetime
 * The caller owns the Ref. Each success returns a lazy atomic `Ref.update` that allocates a new array.
 * Serialized producers collect in callback-Effect execution order. Concurrent updates remain atomic,
 * but execution scheduling—not invocation order—determines array order. Failures are ignored.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const program = Effect.gen(function* () {
 *   const values = yield* Ref.make<ReadonlyArray<number>>([])
 *   return Sink.collect(values)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Collecting values
 */
export function collect<A, E>(ref: Ref.Ref<ReadonlyArray<A>>): Sink<A, E, never> {
  return {
    onSuccess: (value) => Ref.update(ref, (arr) => [...arr, value]),
    onFailure: () => Effect.void,
  };
}

/**
 * Keeps only the first value. Pass a `Ref<Option.Option<A>>` (e.g. `Ref.make(Option.none())`);
 * after running, read the result with `Ref.get(ref)`.
 *
 * @remarks
 * ## Why
 * The first observed value can be retained in a caller-owned location without stopping the producer.
 *
 * ## Ownership and lifetime
 * The caller owns the Ref. Each success returns a lazy atomic update. The first update Effect to
 * execute while the Ref is `None` stores its value; that is the first callback only when the producer
 * executes callback Effects serially. Later updates leave `Some` unchanged. Failures are ignored.
 *
 * @example
 * ```ts
 * import { Effect, Option, Ref } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const program = Effect.gen(function* () {
 *   const first = yield* Ref.make<Option.Option<number>>(Option.none())
 *   return Sink.head(first)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Collecting values
 */
export function head<A, E>(ref: Ref.Ref<Option.Option<A>>): Sink<A, E, never> {
  return {
    onSuccess: (value) => Ref.update(ref, (opt) => (Option.isNone(opt) ? Option.some(value) : opt)),
    onFailure: () => Effect.void,
  };
}

/**
 * Keeps only the last value. Pass a `Ref<Option.Option<A>>` (e.g. `Ref.make(Option.none())`);
 * after running, read the result with `Ref.get(ref)`.
 *
 * @remarks
 * ## Why
 * The latest observed value can be retained independently of producer completion.
 *
 * ## Ownership and lifetime
 * The caller owns the Ref. Each success returns a lazy atomic `Ref.set`. With serialized callback
 * Effects the last callback wins; with concurrent execution the last set to execute wins, which may
 * differ from invocation order. Failures are ignored and the sink acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect, Option, Ref } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 * const program = Effect.gen(function* () {
 *   const latest = yield* Ref.make<Option.Option<number>>(Option.none())
 *   return Sink.last(latest)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Collecting values
 */
export function last<A, E>(ref: Ref.Ref<Option.Option<A>>): Sink<A, E, never> {
  return {
    onSuccess: (value) => Ref.set(ref, Option.some(value)),
    onFailure: () => Effect.void,
  };
}

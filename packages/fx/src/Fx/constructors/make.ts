import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import type { Fiber } from "effect/Fiber";
import { identity } from "effect/Function";
import { pipeArguments } from "effect/Pipeable";
import * as Scope from "effect/Scope";
import { withEarlyExit } from "../../Sink/combinators.js";
import type { Sink } from "../../Sink/Sink.js";
import type { Fx } from "../Fx.js";
import { FxTypeId } from "../TypeId.js";

const VARIANCE: Fx.Variance<any, any, any> = {
  _A: identity,
  _E: identity,
  _R: identity,
};

class Make<A, E, R> implements Fx<A, E, R> {
  readonly [FxTypeId]: Fx.Variance<A, E, R> = VARIANCE;
  readonly run: <RSink>(sink: Sink<A, E, RSink>) => Effect.Effect<unknown, never, R | RSink>;

  constructor(run: <RSink>(sink: Sink<A, E, RSink>) => Effect.Effect<unknown, never, R | RSink>) {
    this.run = run;
  }

  pipe(this: Fx<A, E, R>) {
    return pipeArguments(this, arguments);
  }
}

/**
 * Creates an Fx from a function that provides values to a Sink.
 *
 * This is the lowest-level constructor for Fx, giving you full control over
 * the stream's behavior.
 *
 * @remarks
 * ## Why
 *
 * `make` is the protocol boundary for custom producers. It exposes the real `Sink`
 * operation so libraries can define cardinality, ordering, concurrency, causes, and
 * services without an opinionated source wrapper.
 *
 * ## Ownership and lifetime
 *
 * `make` stores the callback without invoking it. Calling `fx.run(sink)` asks the
 * callback to construct its Effect; executing that Effect performs the subscription.
 * Keep acquisition, publication, and cleanup inside the returned Effect or a required
 * `Scope`, rather than performing side effects while constructing it. The returned
 * Effect has no typed failure channel because producer failures are delivered through
 * `sink.onFailure`; defects and interruption can still affect the run.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { collectAll, make } from "@typed/fx/Fx"
 *
 * const pair = make<number>((sink) =>
 *   Effect.andThen(sink.onSuccess(1), sink.onSuccess(2))
 * )
 * const program = collectAll(pair)
 * ```
 *
 * @param run - A function that takes a `Sink` and returns an `Effect` that drives the stream.
 * @returns An `Fx` instance.
 * @since 1.0.0
 * @category Callback sources
 */
export const make = <A, E = never, R = never>(
  run: <RSink = never>(sink: Sink<A, E, RSink>) => Effect.Effect<unknown, never, R | RSink>,
): Fx<A, E, R> => new Make<A, E, R>(run);

/**
 * Operations supplied to a callback producer for emitting values or ending its run.
 *
 * @remarks
 * ## Why
 *
 * Callback sources need an explicit bridge into Sink operations while retaining the
 * distinction between typed failures, defects, interruption causes, and completion.
 *
 * ## Ownership and lifetime
 *
 * An `Emit` is valid only for the active callback run. Every operation forks the
 * corresponding sink Effect in that run's scope and returns its `Fiber`; callers may
 * inspect or interrupt that delivery. Retaining it after cleanup is unsupported.
 *
 * @since 1.0.0
 * @category Callback protocol
 */
export type Emit<A, E = never> = {
  /**
   * Starts delivery of one value and returns the delivery fiber.
   *
   * @remarks
   * ## Why
   *
   * Callback producers push values when they arrive instead of waiting to be pulled.
   *
   * ## Ownership and lifetime
   *
   * The active callback scope owns the returned fiber; deliveries can overlap when
   * `succeed` is called again before an earlier sink Effect completes.
   *
   * @since 1.0.0
   * @category emitters
   */
  succeed: (value: A) => Fiber<unknown, never>;
  /**
   * Starts delivery of a complete Effect `Cause` and returns the delivery fiber.
   *
   * @remarks
   * ## Why
   *
   * Typed failures, defects, and interruption remain structurally distinct.
   *
   * ## Ownership and lifetime
   *
   * The active callback scope owns the returned fiber. This operation does not
   * automatically call `done`; terminal behavior is determined by the sink.
   *
   * @since 1.0.0
   * @category emitters
   */
  failCause: (cause: Cause.Cause<E>) => Fiber<unknown, never>;
  /**
   * Starts delivery of one typed failure and returns the delivery fiber.
   *
   * @remarks
   * ## Why
   *
   * Expected callback errors enter `E` without being converted to defects.
   *
   * ## Ownership and lifetime
   *
   * The active callback scope owns the returned fiber. The error is wrapped with
   * `Cause.fail` and forwarded to the sink.
   *
   * @since 1.0.0
   * @category emitters
   */
  fail: (error: E) => Fiber<unknown, never>;
  /**
   * Starts delivery of one unexpected defect and returns the delivery fiber.
   *
   * @remarks
   * ## Why
   *
   * Programming defects remain outside the typed `E` channel.
   *
   * ## Ownership and lifetime
   *
   * The active callback scope owns the returned fiber. The value is wrapped with
   * `Cause.die` and forwarded to the sink.
   *
   * @since 1.0.0
   * @category emitters
   */
  die: (error: unknown) => Fiber<unknown, never>;
  /**
   * Requests early completion and returns the sink's early-exit fiber.
   *
   * @remarks
   * ## Why
   *
   * Finite callback APIs need an explicit completion signal distinct from failure.
   *
   * ## Ownership and lifetime
   *
   * The active callback scope owns the returned fiber. Early exit ends the run and
   * causes callback cleanup registered by `callback` to execute.
   *
   * @since 1.0.0
   * @category emitters
   */
  done: () => Fiber<unknown, never>;
};

/**
 * Creates an Fx from a callback-based source.
 *
 * @remarks
 * ## Why
 *
 * DOM events, sockets, observers, and foreign libraries decide when values exist.
 * `callback` turns that push boundary into `Fx` while keeping failure and cleanup
 * inside Effect's structured lifetime.
 *
 * ## Ownership and lifetime
 *
 * Registration is lazy: `run` is called once for each `Fx` run. The run creates a
 * child scope and stays active until `emit.done()`, sink early exit, or interruption.
 * If `run` returns an Effect, it is registered as the scope finalizer. Each emit
 * operation starts its sink handler in a fiber, so handler completion can overlap;
 * use the returned fibers or a serialized source when ordering of effects matters.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { callback, collectUpTo } from "@typed/fx/Fx"
 *
 * const messages = callback<string>((emit) => {
 *   const timer = setInterval(() => emit.succeed("tick"), 10)
 *   return Effect.sync(() => clearInterval(timer))
 * })
 * const program = collectUpTo(messages, 2)
 * ```
 *
 * @param run - A function that receives an `Emit` object to push values/errors.
 *              It can return a cleanup effect.
 * @returns An `Fx` adapted from the callback.
 * @since 1.0.0
 * @category Callback sources
 */
export const callback = <A, E = never, R = never>(
  run: (emit: Emit<A, E>) => void | Effect.Effect<unknown, never, R>,
): Fx<A, E, R> =>
  make<A, E, R>((sink) =>
    Effect.acquireUseRelease(
      Scope.make(),
      (scope) =>
        withEarlyExit(
          sink,
          Effect.fn(function* <RSink = never>(sink: Sink.WithEarlyExit<A, E, RSink>) {
            const services = yield* Effect.context<R | RSink>();
            const runFork = Effect.runForkWith(services);
            const signal = yield* Scope.provide(Effect.abortSignal, scope);

            const runEffect = <A, E>(effect: Effect.Effect<A, E, RSink>) =>
              runFork(effect, { signal });
            const emit: Emit<A, E> = {
              succeed: (value) => runEffect(sink.onSuccess(value)),
              failCause: (cause) => runEffect(sink.onFailure(cause)),
              fail: (error) => runEffect(sink.onFailure(Cause.fail(error))),
              die: (error) => runEffect(sink.onFailure(Cause.die(error))),
              done: () => runEffect(sink.earlyExit),
            };

            const effect = run(emit);
            if (effect) yield* Scope.addFinalizer(scope, Effect.provideContext(effect, services));
            return yield* Effect.never;
          }),
        ),
      Scope.close,
    ),
  );

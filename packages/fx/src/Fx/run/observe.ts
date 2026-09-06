import type { Cause } from "effect/Cause";
import type { Effect } from "effect/Effect";
import {
  callback,
  catchCause,
  ensuring,
  failCause,
  forkScoped,
  isEffect,
  matchCauseEffect,
  runForkWith,
  contextWith,
  sync,
  suspend,
  void as void_,
} from "effect/Effect";
import { interrupt, type Fiber } from "effect/Fiber";
import { dual } from "effect/Function";
import type { Layer } from "effect/Layer";
import { effectDiscard } from "effect/Layer";
import type { Scope } from "effect/Scope";
import { make } from "../../Sink/Sink.js";
import type { Fx } from "../Fx.js";

/**
 * Observes the values of an `Fx` stream using a callback function.
 * The callback can return `void` or an `Effect` which will be executed for each value.
 *
 * @remarks
 * ## Why
 *
 * `observe` is the primary Effect boundary for performing work for each pushed value.
 * A plain callback is lifted to Effect, while an Effect callback contributes its own
 * typed failures and services to the result.
 *
 * ## Ownership and lifetime
 *
 * Observation starts only when the returned Effect runs. That Effect owns the source
 * run and completes when the source completes. Interruption interrupts the internal
 * fiber and source cleanup. Callback invocation follows the producer's delivery
 * behavior; `observe` adds no buffer or concurrency of its own. A source cause or a
 * callback failure fails the returned Effect as `E | E2` and stops further
 * deliveries. The producer fiber finishes cleanup before observation settles;
 * resources acquired in the caller's Scope retain that Scope's lifetime.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { fromIterable, observe } from "@typed/fx/Fx"
 *
 * const program = Effect.gen(function* () {
 *   const total = yield* Ref.make(0)
 *   yield* observe(fromIterable([1, 2, 3]), (value) => Ref.update(total, (n) => n + value))
 *   return yield* Ref.get(total)
 * })
 * ```
 *
 * @param fx - The `Fx` stream to observe.
 * @param f - The function to call for each emitted value.
 * @returns An `Effect` that completes when the stream ends.
 * @since 1.0.0
 * @category Running effects
 */
export const observe: {
  <A, E2 = never, R2 = never>(
    f: (value: A) => void | Effect<unknown, E2, R2>,
  ): <E, R>(fx: Fx<A, E, R>) => Effect<unknown, E | E2, R | R2>;

  <A, E, R, E2 = never, R2 = never>(
    fx: Fx<A, E, R>,
    f: (value: A) => void | Effect<unknown, E2, R2>,
  ): Effect<unknown, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2 = never, R2 = never>(
    fx: Fx<A, E, R>,
    f: (value: A) => void | Effect<unknown, E2, R2>,
  ): Effect<unknown, E | E2, R | R2> =>
    contextWith((services) => {
      let fiber: Fiber<unknown, never> | undefined;

      return callback<void, E | E2, R | R2>((resume) => {
        let done = false;

        const complete = (result: Effect<void, E | E2>) =>
          sync(() => {
            if (done) return;
            done = true;
            resume(result);
          });

        const onFailure = (cause: Cause<E | E2>) => complete(failCause(cause));

        const onSuccess = (value: A) =>
          suspend(() => {
            if (done) return void_;

            const result = f(value);
            return isEffect(result) ? catchCause(result, onFailure) : void_;
          });

        fiber = fx
          .run(make(onFailure, onSuccess))
          .pipe(matchCauseEffect(make(onFailure, () => complete(void_))), runForkWith(services));
      }).pipe(ensuring(suspend(() => (fiber === undefined ? void_ : interrupt(fiber)))));
    }),
);

/**
 * Runs an `Fx` stream to completion, discarding all values.
 * Useful when the side effects of the stream are all that matter.
 *
 * @remarks
 * ## Why
 *
 * Some producers perform all useful work in acquisition, effects, or finalization and
 * need execution without retaining their emitted values.
 *
 * ## Ownership and lifetime
 *
 * Running the Effect owns one source subscription until completion, failure, or
 * interruption. It allocates no collection and adds no per-value effect. Source
 * failures and services remain visible.
 *
 * @example
 * ```ts
 * import { drain, fromIterable } from "@typed/fx/Fx"
 *
 * const program = drain(fromIterable([1, 2, 3]))
 * ```
 *
 * @param fx - The `Fx` stream to drain.
 * @returns An `Effect` that completes when the stream ends.
 * @since 1.0.0
 * @category Running effects
 */
export const drain = <A, E, R>(fx: Fx<A, E, R>): Effect<void, E, R> => observe(fx, () => void_);

/**
 * Runs an `Fx` stream as a Layer.
 * The stream is forked in the background when the layer is acquired.
 *
 * @remarks
 * ## Why
 *
 * A background producer can share the same acquisition and shutdown boundary as an
 * application's Effect [Layer](https://effect.website/docs/v4/api/effect/Layer) graph
 * even when it provides no service itself.
 *
 * ## Ownership and lifetime
 *
 * Building the Layer starts `drain(fx)` with `forkScoped`. Acquisition succeeds after
 * the fiber is registered; it does not wait for that fiber. The Layer scope interrupts
 * the fiber on release. A source failure is stored in the discarded child Fiber exit:
 * it does not fail Layer acquisition and this API exposes no handle for awaiting it.
 * Recover, report, or otherwise observe failures inside `fx` before calling
 * `drainLayer`, or use `fork` when the caller needs the Fiber exit. The annotated `E`
 * channel remains in the public Layer type even though the background exit is not
 * propagated by this implementation. `Scope` is supplied by the Layer.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const reported = Fx.fail("offline").pipe(
 *   Fx.catch((error) => Fx.fromEffect(Effect.logError(error)))
 * )
 * const Background = Fx.drainLayer(reported)
 * const program = Effect.void.pipe(Effect.provide(Background))
 * ```
 *
 * @param fx - The `Fx` stream to run.
 * @returns A `Layer` that manages the background execution of the stream.
 * @since 1.0.0
 * @category Running effects
 */
export const drainLayer = <A, E, R>(fx: Fx<A, E, R>): Layer<never, E, Exclude<R, Scope>> =>
  effectDiscard(forkScoped(drain(fx)));

/**
 * Observes the values of an `Fx` stream using a callback function and returns a `Layer`.
 * The callback can return `void` or an `Effect` which will be executed for each value.
 *
 * @remarks
 * ## Why
 *
 * Observation side effects can be installed as application infrastructure and share
 * the Layer graph's typed dependencies and shutdown behavior.
 *
 * ## Ownership and lifetime
 *
 * Building the Layer forks `observe(fx, f)` in its scope and completes acquisition
 * after registration. Releasing the Layer interrupts the observer and source. Source
 * and callback failures terminate the discarded child Fiber; they do not fail Layer
 * acquisition, and this API exposes no Fiber handle from which to await the exit.
 * Handle or report those failures inside the source/callback, or use `observe`/`fork`
 * when the caller must observe them. The annotated `E | E2` Layer error remains in the
 * public type even though this implementation does not propagate the background exit.
 * `Scope` is supplied internally; delivery behavior remains that of `observe`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { fromIterable, observeLayer } from "@typed/fx/Fx"
 *
 * const report = (value: number) =>
 *   Effect.try({ try: () => JSON.stringify(BigInt(value)), catch: String }).pipe(
 *     Effect.catch((error) => Effect.logError(error))
 *   )
 * const LogValues = observeLayer(fromIterable([1, 2]), report)
 * const program = Effect.void.pipe(Effect.provide(LogValues))
 * ```
 *
 * @param fx - The `Fx` stream to observe.
 * @param f - The function to call for each emitted value.
 * @returns A `Layer` that manages the background execution of the stream.
 * @since 1.0.0
 * @category Running effects
 */
export const observeLayer: {
  <A, E2 = never, R2 = never>(
    f: (value: A) => void | Effect<unknown, E2, R2>,
  ): <E, R>(fx: Fx<A, E, R>) => Layer<never, E | E2, Exclude<R | R2, Scope>>;

  <A, E, R, E2 = never, R2 = never>(
    fx: Fx<A, E, R>,
    f: (value: A) => void | Effect<unknown, E2, R2>,
  ): Layer<never, E | E2, Exclude<R | R2, Scope>>;
} = dual(
  2,
  <A, E, R, E2 = never, R2 = never>(
    fx: Fx<A, E, R>,
    f: (value: A) => void | Effect<unknown, E2, R2>,
  ): Layer<never, E | E2, Exclude<R | R2, Scope>> => effectDiscard(forkScoped(observe(fx, f))),
);

import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

const toFinalizer =
  <XE, XR>(
    f:
      | Effect.Effect<void, XE, XR>
      | ((interruptors: ReadonlySet<number>) => Effect.Effect<void, XE, XR>),
  ) =>
  (interruptors: ReadonlySet<number>) =>
    typeof f === "function" ? f(interruptors) : f;

/**
 * Runs a finalizer when the Fx reports or externally receives interruption.
 *
 * @remarks
 * ## Why
 *
 * Cancellation-specific cleanup should not run for success or ordinary typed
 * failure. The interruptor IDs retain Effect's information about which fibers
 * requested cancellation.
 *
 * ## Ownership and lifetime
 *
 * An interrupt-only Cause reported by the source invokes the finalizer before
 * that Cause is delivered; finalizer failure is combined with it. External
 * interruption of the running fiber also invokes the finalizer, suppressing its
 * failure to preserve cancellation. Those paths are tracked separately: if an
 * external interruption arrives while reported-Cause handling is still active,
 * the finalizer can run once for each path. Successful and non-interrupt failures
 * do not invoke it. A finalizer captured while constructing an Fx is shared by
 * every run of that Fx; create mutable cleanup state lazily inside `gen` or
 * `genScoped` when each subscription must own a distinct resource.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { onInterrupt } from "@typed/fx/Fx"
 * import { interrupt } from "@typed/fx/Fx"
 *
 * const observed = onInterrupt(
 *   interrupt(1),
 *   (ids) => Effect.log(`interrupted by ${ids.size}`)
 * )
 * ```
 *
 * @example Keep the finalizer idempotent when both interrupt paths are possible
 * ```ts
 * import { Effect } from "effect"
 * import { gen } from "@typed/fx/Fx"
 * import { onInterrupt } from "@typed/fx/Fx"
 * import { interrupt } from "@typed/fx/Fx"
 *
 * const observed = gen(function* () {
 *   // `gen` creates this controller separately for every subscription.
 *   const controller = yield* Effect.sync(() => new AbortController())
 *   return onInterrupt(
 *     interrupt(1),
 *     Effect.sync(() => controller.abort()) // `abort` is idempotent.
 *   )
 * })
 * ```
 *
 * @since 1.0.0
 * @category Resource lifetime
 */
export const onInterrupt: {
  <XE, XR>(
    finalizer:
      | Effect.Effect<void, XE, XR>
      | ((interruptors: ReadonlySet<number>) => Effect.Effect<void, XE, XR>),
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | XE, R | XR>;

  <A, E, R, XE, XR>(
    self: Fx<A, E, R>,
    finalizer:
      | Effect.Effect<void, XE, XR>
      | ((interruptors: ReadonlySet<number>) => Effect.Effect<void, XE, XR>),
  ): Fx<A, E | XE, R | XR>;
} = dual(
  2,
  <A, E, R, XE, XR>(
    self: Fx<A, E, R>,
    finalizer_:
      | Effect.Effect<void, XE, XR>
      | ((interruptors: ReadonlySet<number>) => Effect.Effect<void, XE, XR>),
  ): Fx<A, E | XE, R | XR> =>
    make<A, E | XE, R | XR>(
      Effect.fnUntraced(function* (sink) {
        const finalizer = toFinalizer(finalizer_);
        const interrupted = yield* Ref.make(Option.none<ReadonlySet<number>>());

        const record = (ids: ReadonlySet<number>) =>
          Ref.modify(interrupted, (current) =>
            Option.isNone(current)
              ? ([true, Option.some(ids)] as const)
              : ([false, current] as const),
          );

        const runFinalizer = (ids: ReadonlySet<number>) =>
          Effect.flatMap(record(ids), (first) =>
            first
              ? Effect.matchCauseEffect(finalizer(ids), {
                  onFailure: () => Effect.void,
                  onSuccess: () => Effect.void,
                })
              : Effect.void,
          );

        return yield* self
          .run(
            makeSink(
              (cause) =>
                Cause.hasInterruptsOnly(cause)
                  ? Effect.matchCauseEffect(finalizer(Cause.interruptors(cause)), {
                      onFailure: (cause2) => sink.onFailure(Cause.combine(cause, cause2)),
                      onSuccess: () => sink.onFailure(cause),
                    })
                  : sink.onFailure(cause),
              sink.onSuccess,
            ),
          )
          .pipe(Effect.onInterrupt((ids) => runFinalizer(ids)));
      }),
    ),
);

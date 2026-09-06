import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

const toFinalizer =
  <A, E, XE, XR>(f: (exit: Exit.Exit<A, E>) => void | Effect.Effect<void, XE, XR>) =>
  (exit: Exit.Exit<A, E>): Effect.Effect<void, XE, XR> => {
    const x = f(exit);
    return Effect.isEffect(x) ? x : Effect.void;
  };

/**
 * Observes the Fx's final success or failure with an Effect finalizer.
 *
 * @remarks
 * ## Why
 *
 * Teardown and audit work sometimes depends on how the complete subscription
 * ended. An `Exit` preserves that distinction without materializing it as a
 * stream value.
 *
 * ## Ownership and lifetime
 *
 * The finalizer runs once after successful completion, a reported source cause,
 * or interruption of the running fiber. The success Exit carries `void`
 * because an Fx may emit many values and has no single terminal success value.
 * A finalizer failure after normal completion is reported in the returned error
 * channel. After a source failure or interruption it is suppressed so the
 * already-observed termination remains authoritative. Finalizer services live
 * for the subscription only.
 *
 * @example
 * ```ts
 * import { Effect, Exit } from "effect"
 * import { onExit } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const audited = onExit(succeed("ready"), (exit) =>
 *   Effect.log(Exit.isSuccess(exit) ? "complete" : "failed")
 * )
 * ```
 *
 * @since 1.0.0
 * @category Resource lifetime
 */
export const onExit: {
  <A, E, XE = never, XR = never>(
    f: (exit: Exit.Exit<void, E>) => void | Effect.Effect<void, XE, XR>,
  ): <R>(self: Fx<A, E, R>) => Fx<A, E | XE, R | XR>;

  <A, E, R, XE = never, XR = never>(
    self: Fx<A, E, R>,
    f: (exit: Exit.Exit<void, E>) => void | Effect.Effect<void, XE, XR>,
  ): Fx<A, E | XE, R | XR>;
} = dual(
  2,
  <A, E, R, XE, XR>(
    self: Fx<A, E, R>,
    f: (exit: Exit.Exit<void, E>) => void | Effect.Effect<void, XE, XR>,
  ): Fx<A, E | XE, R | XR> =>
    make<A, E | XE, R | XR>(
      Effect.fnUntraced(function* (sink) {
        const finalizer = toFinalizer(f);
        const observed = yield* Ref.make(Option.none<Exit.Exit<void, E>>());

        const recordExit = (exit: Exit.Exit<void, E>) =>
          Ref.modify(observed, (current) =>
            Option.isNone(current)
              ? ([true, Option.some(exit)] as const)
              : ([false, current] as const),
          ).pipe(Effect.asVoid);

        const runFinalizer = (exit: Exit.Exit<void, E>, allowReportFailure: boolean) =>
          Effect.matchCauseEffect(finalizer(exit), {
            onFailure: (cause) => (allowReportFailure ? sink.onFailure(cause) : Effect.void),
            onSuccess: () => Effect.void,
          });

        return yield* self
          .run(
            makeSink(
              (cause) =>
                Effect.flatMap(recordExit(Exit.failCause(cause)), () => sink.onFailure(cause)),
              sink.onSuccess,
            ),
          )
          .pipe(
            Effect.onExit((runExit) =>
              Effect.flatMap(Ref.get(observed), (maybe) =>
                Option.match(maybe, {
                  onSome: (exit) => runFinalizer(exit, false),
                  onNone: () =>
                    Exit.match(runExit, {
                      onFailure: (cause) => runFinalizer(Exit.failCause(cause), false),
                      onSuccess: () => runFinalizer(Exit.succeed<void>(undefined), true),
                    }),
                }),
              ),
            ),
          );
      }),
    ),
);

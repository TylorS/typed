import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Drops consecutive elements that are considered equal by an effectful predicate.
 * When the effect returns `true`, the element is skipped; when `false`, it is emitted.
 *
 * This is the effectful variant of `skipRepeatsWith`: instead of a pure
 * `Equivalence<A>`, you supply `(prev, next) => Effect<boolean>` where `true`
 * means "equal" (skip) and `false` means "changed" (emit).
 *
 * @remarks
 * ## Why
 * `changesWithEffect` supports service-backed or failing equivalence checks. The first value always
 * emits; every later value is compared with the last emitted value and emits only when the effect
 * returns `false`, preserving source order.
 *
 * ## Ownership and lifetime
 * One previous value and a semaphore are scoped to each run. Comparison effects are serialized,
 * interrupted with the run, and add their failures and services to the resulting Fx.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const changes = Fx.fromIterable([1, 1, 2]).pipe(
 *   Fx.changesWithEffect((previous, next) => Effect.succeed(previous === next)),
 * )
 * ```
 *
 * @param f - Effectful function: `(prev, next) => Effect<boolean>`. Return `true` to skip (treat as duplicate), `false` to emit.
 * @returns An `Fx` with consecutive "equal" elements removed.
 * @since 1.0.0
 * @category Selecting values
 */
export const changesWithEffect: {
  <A, E2, R2>(
    f: (prev: A, next: A) => Effect.Effect<boolean, E2, R2>,
  ): <E, R>(fx: Fx<A, E | E2, R>) => Fx<A, E | E2, R | R2>;

  <A, E, R, E2, R2>(
    fx: Fx<A, E | E2, R>,
    f: (prev: A, next: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    fx: Fx<A, E | E2, R>,
    f: (prev: A, next: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>((sink) =>
      sinkCore.withStateSemaphore(sink, Option.none<A>(), (s) =>
        fx.run(
          makeSink(s.onFailure, (a2) =>
            Effect.matchCauseEffect(
              Effect.flatMap(s.get, (state) =>
                Option.match(state, {
                  onNone: () =>
                    Effect.flatMap(s.onSuccess(a2), () =>
                      s.updateEffect(() => Effect.succeed(Option.some(a2))),
                    ),
                  onSome: (prev) =>
                    Effect.matchCauseEffect(f(prev, a2), {
                      onFailure: (cause) => s.onFailure(cause),
                      onSuccess: (equal) =>
                        equal
                          ? s.updateEffect(() => Effect.succeed(Option.some(prev)))
                          : Effect.flatMap(s.onSuccess(a2), () =>
                              s.updateEffect(() => Effect.succeed(Option.some(a2))),
                            ),
                    }),
                }),
              ),
              { onFailure: (cause) => s.onFailure(cause), onSuccess: () => Effect.void },
            ),
          ),
        ),
      ),
    ),
);

import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { map } from "./map.js";

/**
 * Emits `[source, latest]` whenever the source emits, using the latest value
 * from `that`. Source values are dropped until `that` has emitted at least once.
 *
 * Unlike {@link zipLatest}, this does **not** emit when `that` updates.
 *
 * **Completion:** Completes when the source completes.
 * **Errors:** The first failure from either stream fails the result.
 *
 * @remarks
 * ## Why
 * `withLatestFrom` makes the left source the sole emission trigger while enriching it with right-side
 * state. Left values before the right's first value are dropped; right updates never emit alone.
 *
 * ## Ownership and lifetime
 * The right source runs in a child fiber and one latest value is retained. Left completion or
 * consumer interruption interrupts that fiber; failure from either side is forwarded.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const labeled = Fx.withLatestFrom(Fx.fromIterable([1, 2]), Fx.succeed("ready"))
 * ```
 *
 * @since 1.0.0
 * @category Combining sources
 */
export const withLatestFrom: {
  <B, E2, R2>(
    that: Fx<B, E2, R2>,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<readonly [A, B], E | E2, R | R2>;
  <A, E, R, B, E2, R2>(self: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<readonly [A, B], E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    that: Fx<B, E2, R2>,
  ): Fx<readonly [A, B], E | E2, R | R2> =>
    make<readonly [A, B], E | E2, R | R2>((sink) =>
      Effect.gen(function* () {
        const latest = yield* Ref.make(Option.none<B>());
        const other = yield* Effect.forkChild(
          that.run(makeSink(sink.onFailure, (b: B) => Ref.set(latest, Option.some(b)))),
          { startImmediately: true, uninterruptible: false },
        );
        yield* Effect.yieldNow;

        yield* self
          .run(
            makeSink(sink.onFailure, (a: A) =>
              Effect.flatMap(Ref.get(latest), (opt) =>
                Option.match(opt, {
                  onNone: () => Effect.void,
                  onSome: (b) => sink.onSuccess([a, b] as const),
                }),
              ),
            ),
          )
          .pipe(Effect.ensuring(Fiber.interrupt(other)));
      }),
    ),
);

/**
 * Like {@link withLatestFrom}, but combines the pair with `f`.
 *
 * @remarks
 * ## Why
 * `withLatestFromWith` applies a synchronous projection at each eligible left emission without
 * allocating a public tuple stage. Cardinality and triggering remain those of `withLatestFrom`.
 *
 * ## Ownership and lifetime
 * It inherits the child right-hand fiber and latest-value lifetime from `withLatestFrom`; the pure
 * projection adds no failures, services, or resources.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const labels = Fx.withLatestFromWith(Fx.fromIterable([1]), Fx.succeed("item"), (n, kind) => `${kind}-${n}`)
 * ```
 *
 * @since 1.0.0
 * @category Combining sources
 */
export const withLatestFromWith: {
  <A, B, E2, R2, C>(
    that: Fx<B, E2, R2>,
    f: (a: A, b: B) => C,
  ): <E, R>(self: Fx<A, E, R>) => Fx<C, E | E2, R | R2>;
  <A, E, R, B, E2, R2, C>(
    self: Fx<A, E, R>,
    that: Fx<B, E2, R2>,
    f: (a: A, b: B) => C,
  ): Fx<C, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, B, E2, R2, C>(
    self: Fx<A, E, R>,
    that: Fx<B, E2, R2>,
    f: (a: A, b: B) => C,
  ): Fx<C, E | E2, R | R2> => map(withLatestFrom(self, that), (pair) => f(pair[0], pair[1])),
);

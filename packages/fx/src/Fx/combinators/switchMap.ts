import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import * as SyncronizedRef from "effect/SynchronizedRef";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";
import type { FlatMapLike } from "./flatMap.js";

/**
 * Maps each element of an Fx to a new Fx, and switches to the latest inner Fx.
 *
 * When a new element is emitted, the previous inner Fx is cancelled.
 *
 * @remarks
 * ## Why
 *
 * `switchMap` models work whose result becomes obsolete when a newer source
 * value arrives, such as suggestions for the current query. Cancellation is the
 * policy: obsolete work is not allowed to finish in the background.
 *
 * ## Switching, ordering, and cardinality
 *
 * Every source value calls `f`. Before the new inner starts, the previous inner
 * is interrupted and its interruption is awaited. Only the latest inner remains
 * active; values it emitted before replacement remain visible, while later
 * values from the replaced inner are suppressed. There is no result buffer.
 *
 * ## Ownership and lifetime
 *
 * Source and current-inner failures are forwarded and their services remain
 * typed. The returned Fx requires `Scope`, which owns the current inner fiber.
 * Source completion waits for the latest inner. Replacing or interrupting the
 * output closes obsolete inner work and runs its scoped finalizers before the
 * replacement proceeds.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const queries = Fx.mergeAll(
 *   Fx.at("typed", "0 millis"),
 *   Fx.at("typed fx", "5 millis")
 * )
 * const suggestions = Fx.switchMap(queries, (query) =>
 *   Fx.ensuring(Fx.at(query, "20 millis"), Effect.log(`${query} closed`))
 * )
 * Effect.runPromise(Effect.scoped(Fx.collectAll(suggestions))).then(console.log)
 * // logs cleanup for "typed" and resolves ["typed fx"]
 * ```
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @returns An `Fx` that emits values from the latest inner stream.
 * @since 1.0.0
 * @category Concurrent work
 */
export const switchMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> =>
    make<B, E | E2, R | R2 | Scope.Scope>(
      Effect.fn(function* (sink) {
        const ctx = yield* Effect.context<R2 | Scope.Scope>();
        const scope = Context.get(ctx, Scope.Scope);
        const fiberRef = yield* SyncronizedRef.make<Fiber.Fiber<unknown, never> | null>(null);

        const next = (value: A) =>
          Effect.forkIn(Effect.provideContext(f(value).run(sink), ctx), scope, {
            startImmediately: false,
            uninterruptible: false,
          });

        yield* self.run(
          makeSink(sink.onFailure, (value: A) =>
            SyncronizedRef.updateEffect(fiberRef, (fiber) =>
              fiber ? Fiber.interrupt(fiber).pipe(Effect.flatMap(() => next(value))) : next(value),
            ),
          ),
        );

        const fiber = yield* SyncronizedRef.get(fiberRef);
        if (fiber) {
          yield* Fiber.join(fiber);
        }
      }, extendScope),
    ),
);

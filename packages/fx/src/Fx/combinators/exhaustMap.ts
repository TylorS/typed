import * as Effect from "effect/Effect";
import * as FiberHandle from "effect/FiberHandle";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";
import type { FlatMapLike } from "./flatMap.js";

/**
 * Maps each element of an Fx to a new Fx, ignoring new elements until the current inner Fx completes.
 *
 * @remarks
 * ## Why
 *
 * `exhaustMap` is an admission policy for work that must never overlap and does
 * not need a backlog, such as ignoring repeated submit events while one submit
 * is running.
 *
 * ## Admission, ordering, and cardinality
 *
 * The first source value observed while idle admits one inner Fx. For values
 * arriving while it runs, `f` is still evaluated to construct an inner, but that
 * inner is not run and no value is queued. Every admitted inner may emit any
 * number of values in its own order.
 *
 * ## Ownership and lifetime
 *
 * Source and admitted-inner failures are forwarded and their services remain
 * typed. A `FiberHandle` in the required `Scope` owns the active inner. Source
 * completion waits for that inner; interruption closes the handle and the
 * inner's child Scope, running its finalizers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const submits = Fx.mergeAll(
 *   Fx.at("first", "0 millis"),
 *   Fx.at("ignored while busy", "5 millis"),
 *   Fx.at("later", "30 millis")
 * )
 * const accepted = Fx.exhaustMap(submits, (command) => Fx.at(command, "20 millis"))
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(accepted))).then(console.log)
 * // ["first", "later"]
 * ```
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @returns An `Fx` that emits values from the active inner stream.
 * @since 1.0.0
 * @category Concurrent work
 */
export const exhaustMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> =>
    make<B, E | E2, R | R2 | Scope.Scope>(
      Effect.fn(function* (sink) {
        const handle = yield* FiberHandle.make<void, never>();
        yield* self.run(
          makeSink(sink.onFailure, (a) =>
            FiberHandle.run(handle, f(a).run(sink), { onlyIfMissing: true }),
          ),
        );
        yield* FiberHandle.awaitEmpty(handle);
      }, extendScope),
    ),
);

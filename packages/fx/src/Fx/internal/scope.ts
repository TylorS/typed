import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import type { Scheduler } from "effect/Scheduler";
import * as Scope from "effect/Scope";

/** Finalizer execution order accepted by the published Fx scope helpers.
 *
 * @remarks
 * ## Why
 *
 * Fx operators sometimes require deterministic teardown and sometimes permit independent
 * finalizers to run concurrently. This narrower type exposes only the strategies these helpers
 * intentionally forward to Effect Scope.
 *
 * ## Ownership and lifetime
 *
 * This is compile-time metadata and acquires no runtime resources.
 *
 * @since 1.0.0
 * @category type-level
 * @stability internal-but-published
 */
export type ExecutionStrategy = "sequential" | "parallel";

/** Forks a closeable child from the current Scope and passes it to an Effect builder.
 *
 * @remarks
 * ## Why
 *
 * Operators need a lifetime they can close independently while still guaranteeing that the parent
 * Scope eventually closes it if the operator is interrupted.
 *
 * ## Ownership and lifetime
 *
 * The caller's required Scope owns the forked child. This helper does not close the child when `f`
 * returns; parent closure does. Use `withExtendedScope` when the child must close at the returned
 * Effect's exit. `f` retains its exact value, typed error, and service channels.
 *
 * @example
 * ```ts
 * import { withCloseableScope } from "@typed/fx/Fx/internal/scope"
 * import * as Effect from "effect/Effect"
 *
 * const child = withCloseableScope((scope) => Effect.succeed(scope), "sequential")
 * const scope = Effect.runSync(Effect.scoped(child))
 * ```
 *
 * @since 1.0.0
 * @category lifecycle
 * @stability internal-but-published
 */
export const withCloseableScope = <A, E, R>(
  f: (scope: Scope.Closeable) => Effect.Effect<A, E, R>,
  executionStrategy?: ExecutionStrategy,
): Effect.Effect<A, E, R | Scope.Scope> =>
  Effect.scopedWith((scope) => Effect.flatMap(Scope.fork(scope, executionStrategy), f));

/** Runs an Effect in a child Scope and closes that child when the Effect exits.
 *
 * @remarks
 * ## Why
 *
 * Flattening and timing operators often need resources acquired by one inner Effect to survive its
 * local construction but not the enclosing operator run.
 *
 * ## Ownership and lifetime
 *
 * A sequentially closing child Scope is forked from the required parent Scope, installed as the
 * Effect's `Scope.Scope` service, and closed with the same `Exit` on success, typed failure, defect,
 * or interruption. Non-Scope services and the `A`/`E` channels are unchanged.
 *
 * @example
 * ```ts
 * import { extendScope } from "@typed/fx/Fx/internal/scope"
 * import * as Effect from "effect/Effect"
 *
 * const value = Effect.scoped(extendScope(Effect.succeed("ready")))
 * ```
 *
 * @since 1.0.0
 * @category lifecycle
 * @stability internal-but-published
 */
export const extendScope = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R | Scope.Scope> =>
  withCloseableScope(
    (scope) => Scope.provide(effect.pipe(Effect.onExit((exit) => Scope.close(scope, exit))), scope),
    "sequential",
  );

/** Builds and runs an Effect inside a child Scope that closes at the Effect's exit.
 *
 * @remarks
 * ## Why
 *
 * This combines access to the closeable child with guaranteed local teardown, allowing an operator
 * to register resources and also close the lifetime explicitly before the parent ends.
 *
 * ## Ownership and lifetime
 *
 * The required parent Scope owns the child as a fallback. The child is provided to `f` as the
 * current Scope and is also closed with `f`'s exact `Exit`. `executionStrategy` controls ordering of
 * its finalizers. The helper preserves typed errors and remaining service requirements.
 *
 * @example
 * ```ts
 * import { withExtendedScope } from "@typed/fx/Fx/internal/scope"
 * import * as Effect from "effect/Effect"
 * import * as Scope from "effect/Scope"
 *
 * const program = withExtendedScope((scope) =>
 *   Scope.addFinalizer(scope, Effect.log("child closed"))
 * )
 * Effect.runSync(Effect.scoped(program))
 * ```
 *
 * @since 1.0.0
 * @category lifecycle
 * @stability internal-but-published
 */
export const withExtendedScope = <A, E, R>(
  f: (scope: Scope.Closeable) => Effect.Effect<A, E, R>,
  executionStrategy?: ExecutionStrategy,
): Effect.Effect<A, E, R | Scope.Scope> =>
  withCloseableScope(
    (scope) =>
      Scope.provide(f(scope).pipe(Effect.onExit((exit) => Scope.close(scope, exit))), scope),
    executionStrategy,
  );

/** Starts Effects as interruptible fibers owned by an operator's child Scope.
 *
 * @remarks
 * ## Why
 *
 * Passing a constrained fork function prevents nested work from escaping the exact lifetime an Fx
 * operator established for it.
 *
 * ## Ownership and lifetime
 *
 * Each returned Fiber is closed by that child Scope. The forked Effect keeps its own typed error and
 * service channels; fiber creation itself cannot fail in the typed channel.
 *
 * @since 1.0.0
 * @category type-level
 * @stability internal-but-published
 */
export type Fork = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
) => Effect.Effect<Fiber.Fiber<A, E>, never, R>;

/** Provides a child Scope and a function for forking interruptible work into it.
 *
 * @remarks
 * ## Why
 *
 * Concurrent Fx operators need all child fibers to terminate together when their operator run ends,
 * including failure and interruption paths.
 *
 * ## Ownership and lifetime
 *
 * The helper uses `withExtendedScope`, so the child closes on every exit and remains attached to the
 * required parent Scope. Forks use `Effect.forkIn` with `uninterruptible: false` and
 * `startImmediately: false`; their services come from the Effect supplied to `fork`. Finalizer order
 * follows `executionStrategy`.
 *
 * @example
 * ```ts
 * import { withScopedFork } from "@typed/fx/Fx/internal/scope"
 * import * as Effect from "effect/Effect"
 * import * as Fiber from "effect/Fiber"
 *
 * const program = withScopedFork((fork) =>
 *   Effect.flatMap(fork(Effect.succeed(1)), Fiber.join)
 * )
 * Effect.runSync(Effect.scoped(program))
 * ```
 *
 * @since 1.0.0
 * @category lifecycle
 * @stability internal-but-published
 */
export const withScopedFork = <A, E, R>(
  f: (fork: Fork, scope: Scope.Closeable) => Effect.Effect<A, E, R>,
  executionStrategy?: ExecutionStrategy,
): Effect.Effect<A, E, R | Scope.Scope> =>
  withExtendedScope(
    (scope) =>
      f(
        (eff) => Effect.forkIn(eff, scope, { uninterruptible: false, startImmediately: false }),
        scope,
      ),
    executionStrategy,
  );

/** Suspends until a Scope starts running its finalizers.
 *
 * @remarks
 * ## Why
 *
 * Subjects remain subscribed for the lifetime of their observing Scope even when there is no other
 * Effect work to await. Registering a finalizer turns that lifetime boundary into a completion
 * signal without polling.
 *
 * ## Ownership and lifetime
 *
 * Execution registers one finalizer on `scope` from a small helper fiber using the current
 * scheduler. The Effect resumes when that finalizer runs. Cancelling the callback interrupts the
 * registration fiber; once registration has completed, the finalizer belongs to `scope`. No typed
 * errors or services are introduced.
 *
 * @example
 * ```ts
 * import { awaitScopeClose } from "@typed/fx/Fx/internal/scope"
 * import * as Effect from "effect/Effect"
 * import * as Exit from "effect/Exit"
 * import * as Fiber from "effect/Fiber"
 * import * as Scope from "effect/Scope"
 *
 * const program = Effect.gen(function* () {
 *   const scope = yield* Scope.make()
 *   const waiter = yield* Effect.forkDetach(awaitScopeClose(scope))
 *   yield* Scope.close(scope, Exit.void)
 *   yield* Fiber.join(waiter)
 * })
 * ```
 *
 * @since 1.0.0
 * @category lifecycle
 * @stability internal-but-published
 */
export function awaitScopeClose(scope: Scope.Scope) {
  return Effect.callback<unknown, never, never>(function (this: Scheduler, cb) {
    return Fiber.interrupt(
      Effect.runFork(
        Scope.addFinalizerExit(scope, () => Effect.sync(() => cb(Effect.void))),
        { scheduler: this },
      ),
    );
  });
}

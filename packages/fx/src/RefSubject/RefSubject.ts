/** @effect-diagnostics missingEffectError:skip-file */
/** @effect-diagnostics missingEffectContext:skip-file */

import * as Array from "effect/Array";
import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Effectable from "effect/Effectable";
import * as Semaphore from "effect/Semaphore";
import { equals } from "effect/Equal";
import type { Equivalence } from "effect/Equivalence";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import { dual, identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as MutableRef from "effect/MutableRef";
import { sum } from "effect/Number";
import * as Option from "effect/Option";
import { pipeArguments } from "effect/Pipeable";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import * as Stream from "effect/Stream";
import { compact as fxCompact } from "../Fx/combinators/compact.js";
import { continueWith } from "../Fx/combinators/continueWith.js";
import { filterMapEffect as fxFilterMapEffect } from "../Fx/combinators/filterMapEffect.js";
import { mapEffect as fxMapEffect } from "../Fx/combinators/mapEffect.js";
import { mergeAll as fxMergeAll } from "../Fx/combinators/mergeAll.js";
import { scanEffect as fxScanEffect } from "../Fx/combinators/scan.js";
import { skipRepeats } from "../Fx/combinators/skipRepeats.js";
import type { Bounds } from "../Fx/combinators/slice.js";
import { slice as fxSlice } from "../Fx/combinators/slice.js";
import { unwrap } from "../Fx/combinators/unwrap.js";
import { fromEffect as fxFromEffect } from "../Fx/constructors/fromEffect.js";
import type { Error as FxError, Fx } from "../Fx/index.js";
import * as DeferredRef from "../Fx/internal/DeferredRef.js";
import { getExitEquivalence } from "../Fx/internal/equivalence.js";
import type { UnionToTuple } from "../Fx/internal/UnionToTuple.js";
import { YieldableFx } from "../Fx/internal/yieldable.js";
import { FxTypeId, isFx } from "../Fx/TypeId.js";
import * as Sink from "../Sink/Sink.js";
import * as Subject from "../Subject/Subject.js";
import * as Versioned from "../Versioned/Versioned.js";
import { hasProperty } from "effect/Predicate";

/**
 * Runtime symbol identifying writable RefSubject values.
 *
 * @remarks
 * ## Why
 *
 * Provides stable runtime identity for RefSubject values without relying on classes or a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration performs no acquisition and retains no resources. Implementations preserve
 * source errors, services, and lifetime.
 *
 * @since 1.18.0
 * @category Type identity
 */
export const RefSubjectTypeId = Symbol.for("@typed/fx/RefSubject");
/**
 * Describes the ref subject type id type.
 *
 * @remarks
 * ## Why
 *
 * Provides stable runtime identity for RefSubject values without relying on classes or a renderer.
 *
 * ## Ownership and lifetime
 *
 * RefSubjectTypeId is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type RefSubjectTypeId = typeof RefSubjectTypeId;

/**
 * Runtime symbol identifying read-only Computed values.
 *
 * @remarks
 * ## Why
 *
 * Provides stable runtime identity for Computed values without relying on classes or a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration performs no acquisition and retains no resources. Implementations preserve
 * source errors, services, and lifetime.
 *
 * @since 1.18.0
 * @category Type identity
 */
export const ComputedTypeId = Symbol.for("@typed/fx/Computed");
/**
 * Describes the computed type id type.
 *
 * @remarks
 * ## Why
 *
 * Provides stable runtime identity for Computed values without relying on classes or a renderer.
 *
 * ## Ownership and lifetime
 *
 * ComputedTypeId is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type ComputedTypeId = typeof ComputedTypeId;

/**
 * Runtime symbol identifying conditionally available Filtered values.
 *
 * @remarks
 * ## Why
 *
 * Provides stable runtime identity for Filtered values without relying on classes or a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration performs no acquisition and retains no resources. Implementations preserve
 * source errors, services, and lifetime.
 *
 * @since 1.18.0
 * @category Type identity
 */
export const FilteredTypeId = Symbol.for("@typed/fx/Filtered");
/**
 * Describes the filtered type id type.
 *
 * @remarks
 * ## Why
 *
 * Provides stable runtime identity for Filtered values without relying on classes or a renderer.
 *
 * ## Ownership and lifetime
 *
 * FilteredTypeId is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type FilteredTypeId = typeof FilteredTypeId;

/**
 * A `Computed` is a read-only view of a value that can change over time.
 * It is an `Fx` that emits the current value and subsequent updates.
 * It is also an `Effect` that samples the current value.
 *
 * @remarks
 * ## Why
 *
 * Represents derived state as both an Effectful current read and an Fx of subsequent versions,
 * without granting write access.
 *
 * ## Ownership and lifetime
 *
 * Computed is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { RefSubject } from "@typed/fx"
 * import { Fx } from "@typed/fx"
 *
 * // Create a RefSubject and derive a Computed from it
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   // Create a computed that doubles the count
 *   const doubled = RefSubject.map(count, (n) => n * 2)
 *
 *   // Sample the computed value
 *   const value = yield* doubled
 *   console.log(value) // 0
 *
 *   // Update the source
 *   yield* RefSubject.set(count, 5)
 *
 *   // The computed automatically reflects the change
 *   const newValue = yield* doubled
 *   console.log(newValue) // 10
 * })
 * ```
 *
 * @since 1.0.0
 * @category Read-only state
 */
export interface Computed<out A, out E = never, out R = never> extends Versioned.Versioned<
  R,
  E,
  A,
  E,
  R | Scope.Scope,
  A,
  E,
  R
> {
  /**
   * Carries the runtime marker recognized by `isComputed`.
   *
   * @remarks
   * ## Why
   *
   * Marks the value as Computed for runtime guards and composition without granting writable
   * RefSubject operations.
   *
   * ## Ownership and lifetime
   *
   * This declaration performs no acquisition and retains no resources. Implementations preserve
   * source errors, services, and lifetime.
   *
   * @since 1.18.0
   * @category State protocol
   */
  readonly [ComputedTypeId]: ComputedTypeId;
}

/**
 * Type utilities for read-only Computed state.
 *
 * @remarks
 * ## Why
 *
 * Represents derived state as both an Effectful current read and an Fx of subsequent versions,
 * without granting write access.
 *
 * ## Ownership and lifetime
 *
 * A namespace declaration performs no read or acquisition. The Computed values described by its
 * members retain their own errors, services, and Scope-owned observation lifetimes.
 *
 * @since 1.18.0
 * @category Read-only state
 */
export declare namespace Computed {
  /**
   * Describes the any type.
   *
   * @remarks
   * ## Why
   *
   * The result remains a lazy view rather than a duplicated mutable value.
   *
   * ## Ownership and lifetime
   *
   * Any is a contract and performs no acquisition. Implementations retain the errors, services,
   * interruption, and Scope requirements expressed by its members.
   *
   * @since 1.18.0
   * @category Type utilities
   */
  export type Any =
    | Computed<any, any, any>
    | Computed<never, any, any>
    | Computed<any, never, any>
    | Computed<never, never, any>;
}

/**
 * A `Filtered` is a `Computed` that may not always have a value.
 * It is essentially a `Computed<Option<A>>` with helper methods.
 *
 * @remarks
 * ## Why
 *
 * Represents a derived value that may be absent now and become available on a later push,
 * preserving absence in the state contract.
 *
 * ## Ownership and lifetime
 *
 * Filtered is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import { RefSubject } from "@typed/fx"
 *
 * // Create a RefSubject and filter it
 * const program = Effect.gen(function* () {
 *   const numbers = yield* RefSubject.make([1, 2, 3, 4, 5])
 *
 *   // Get the first even number (filtered)
 *   const firstEven = RefSubject.filterMap(
 *     numbers,
 *     (arr) => Option.fromNullable(arr.find((n) => n % 2 === 0))
 *   )
 *
 *   // Try to get the value (may fail with NoSuchElementError)
 *   const value = yield* firstEven
 *   console.log(value) // 2
 *
 *   // Or convert back to Option
 *   const option = firstEven.asComputed()
 *   const maybeValue = yield* option
 *   console.log(Option.isSome(maybeValue)) // true
 * })
 * ```
 *
 * @since 1.0.0
 * @category Read-only state
 */
export interface Filtered<out A, out E = never, out R = never> extends Versioned.Versioned<
  R,
  E,
  A,
  E,
  R | Scope.Scope,
  A,
  E | Cause.NoSuchElementError,
  R
> {
  /**
   * Carries the runtime marker distinguishing conditional Filtered state from Computed state.
   *
   * @remarks
   * ## Why
   *
   * Marks the value as Filtered for runtime guards and composition without changing its data or
   * error channels.
   *
   * ## Ownership and lifetime
   *
   * This declaration performs no acquisition and retains no resources. Implementations preserve
   * source errors, services, and lifetime.
   *
   * @since 1.18.0
   * @category State protocol
   */
  readonly [FilteredTypeId]: FilteredTypeId;

  /**
   * Converts the Filtered back to a Computed of Option.
   *
   * @example
   * ```ts
   * import { Effect, Option } from "effect"
   * import * as RefSubject from "@typed/fx/RefSubject"
   *
   * const program = Effect.gen(function* () {
   *   const filtered = RefSubject.filterMap(
   *     yield* RefSubject.make([1, 2, 3]),
   *     (arr) => Option.fromNullable(arr.find((n) => n > 5))
   *   )
   *
   *   // Convert to Computed<Option<number>>
   *   const computed = filtered.asComputed()
   *   const option = yield* computed
   *   console.log(Option.isNone(option)) // true (no number > 5)
   * })
   * ```
   * @category Optional queries
   * @since 1.18.0
   * @remarks
   * ## Why
   *
   * Converts the Filtered back to a Computed of Option. The result remains a lazy view rather than a
   * duplicated mutable value.
   *
   * ## Ownership and lifetime
   *
   * The as computed view retains no independent state. Effectful reads sample the source once;
   * Fx observation follows later pushes and the observing Scope finalizes it.
   *
   */
  asComputed(): Computed<Option.Option<A>, E, R>;
}

/**
 * Type utilities for conditionally available Filtered state.
 *
 * @remarks
 * ## Why
 *
 * Represents a derived value that may be absent now and become available on a later push,
 * preserving absence in the state contract.
 *
 * ## Ownership and lifetime
 *
 * A namespace declaration performs no read or acquisition. Individual Filtered values fail
 * current reads with `NoSuchElementError` while absent; their observing Scope owns Fx cleanup.
 *
 * @since 1.18.0
 * @category Read-only state
 */
export declare namespace Filtered {
  /**
   * Describes the any type.
   *
   * @remarks
   * ## Why
   *
   * Gives generic utilities one structural supertype for Filtered values without erasing the
   * concrete channels of values passed through those utilities.
   *
   * ## Ownership and lifetime
   *
   * Any is a contract and performs no acquisition. Implementations retain the errors, services,
   * interruption, and Scope requirements expressed by its members.
   *
   * @since 1.18.0
   * @category Type utilities
   */
  export type Any =
    | Filtered<any, any, any>
    | Filtered<never, any, any>
    | Filtered<any, never, any>
    | Filtered<never, never, any>;
}

/**
 * Interface for basic RefSubject operations: get, set, delete.
 * @remarks
 * ## Why
 *
 * Interface for basic RefSubject operations: get, set, delete.
 *
 * ## Ownership and lifetime
 *
 * GetSetDelete is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.0.0
 * @category Transactions
 */
export interface GetSetDelete<A, E = never, R = never> {
  /**
   * Reads the value visible to the current transaction.
   *
   * @remarks
   * ## Why
   *
   * Reads the value visible inside the current transaction without publishing a change.
   *
   * ## Ownership and lifetime
   *
   * Running `get` performs no mutation or acquisition. It can fail with `E` and requires `R`; when
   * used by `updates`, it observes that transaction's buffered value.
   *
   * @since 1.18.0
   * @category Current reads
   */
  readonly get: Effect.Effect<A, E, R>;
  /**
   * Replaces the value inside the current transaction.
   *
   * @remarks
   * ## Why
   *
   * The transition is serialized at the RefSubject rather than coordinated by callers or UI
   * components.
   *
   * ## Ownership and lifetime
   *
   * Running set performs one serialized subject transition and returns the committed value. It
   * acquires no resource and preserves source failures and services.
   *
   * @since 1.18.0
   * @category State updates
   */
  readonly set: (a: A) => Effect.Effect<A, E, R>;
  /**
   * Removes and returns the value visible to the current transaction.
   *
   * @remarks
   * ## Why
   *
   * Removes the value from the current transaction and returns the previous value as `Some`, or
   * `None` when no value was present.
   *
   * ## Ownership and lifetime
   *
   * Running delete performs one serialized subject transition and returns the committed value.
   * It acquires no resource and preserves source failures and services.
   *
   * @since 1.18.0
   * @category State updates
   */
  readonly delete: Effect.Effect<Option.Option<A>, E, R>;
}

/**
 * A `RefSubject` is a mutable reference that can be observed as an Fx.
 * It combines the capabilities of a `Ref` (get/set/update) with a `Subject` (subscribe).
 *
 * @remarks
 * ## Why
 *
 * Unifies synchronized mutable state, Effectful current reads, and Fx pushes so the same state can
 * be tested and consumed without a renderer.
 *
 * ## Ownership and lifetime
 *
 * RefSubject is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx, RefSubject } from "@typed/fx"
 *
 * // Create a RefSubject with an initial value
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   // Get the current value
 *   const current = yield* count
 *   console.log(current) // 0
 *
 *   // Update the value
 *   yield* RefSubject.set(count, 5)
 *   const updated = yield* count
 *   console.log(updated) // 5
 *
 *   // Use as an Fx to observe changes
 *   yield* Effect.forkScoped(Fx.observe(
 *     count,
 *     (value) => Effect.sync(() => console.log("Count changed:", value))
 *   ))
 *
 *   // Increment
 *   yield* RefSubject.increment(count)
 *   // Output: "Count changed: 6"
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Writable state
 */
export interface RefSubject<A, E = never, R = never>
  extends Computed<A, E, R>, Subject.Subject<A, E, R> {
  /**
   * Carries the runtime marker recognized by `isRefSubject`.
   *
   * @remarks
   * ## Why
   *
   * Marks the value as a writable RefSubject for runtime guards while retaining its Computed and
   * Subject capabilities.
   *
   * ## Ownership and lifetime
   *
   * This declaration performs no acquisition and retains no resources. Implementations preserve
   * source errors, services, and lifetime.
   *
   * @since 1.18.0
   * @category State protocol
   */
  readonly [RefSubjectTypeId]: RefSubjectTypeId;

  /**
   * Runs an effect that can modify the RefSubject transactionally.
   * All operations within the transaction are atomic and serialized.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import * as RefSubject from "@typed/fx/RefSubject"
   *
   * const program = Effect.gen(function* () {
   *   const balance = yield* RefSubject.make(100)
   *
   *   // Transfer money atomically
   *   yield* balance.updates((ref) =>
   *     Effect.gen(function* () {
   *       const current = yield* ref.get
   *       if (current >= 50) {
   *         yield* ref.set(current - 50)
   *         return "Transfer successful"
   *       }
   *       return "Insufficient funds"
   *     })
   *   )
   * })
   * ```
   * @category Transactions
   * @since 1.18.0
   * @remarks
   * ## Why
   *
   * Runs an effect that can modify the RefSubject transactionally. All operations within the
   * transaction are atomic and serialized. The transition is serialized at the RefSubject rather
   * than coordinated by callers or UI components.
   *
   * ## Ownership and lifetime
   *
   * Running updates performs one serialized subject transition and returns the committed value.
   * It acquires no resource and preserves source failures and services.
   *
   */
  readonly updates: <B, E2, R2>(
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
  ) => Effect.Effect<B, E | E2, R | R2>;

  /**
   * Interrupts the RefSubject, stopping all subscriptions and cleaning up resources.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import * as RefSubject from "@typed/fx/RefSubject"
   *
   * const program = Effect.gen(function* () {
   *   const ref = yield* RefSubject.make(0)
   *
   *   // Later, clean up
   *   yield* ref.interrupt
   * })
   * ```
   * @category Lifetime
   * @since 1.18.0
   * @remarks
   * ## Why
   *
   * Interrupts the RefSubject, stopping all subscriptions and cleaning up resources.
   *
   * ## Ownership and lifetime
   *
   * Running this Effect returns `void`: it resets pending initialization, closes the RefSubject's
   * private Scope, interrupts its initializer fiber, and interrupts its Subject. It cannot fail;
   * `R` supplies services captured by the RefSubject's internal lifetime.
   *
   */
  readonly interrupt: Effect.Effect<void, never, R>;
}

/**
 * Type utilities and service contracts for RefSubject values.
 *
 * @remarks
 * ## Why
 *
 * Unifies synchronized mutable state, Effectful current reads, and Fx pushes so the same state can
 * be tested and consumed without a renderer.
 *
 * ## Ownership and lifetime
 *
 * The namespace itself cannot run, read, or commit state. It groups structural helper types and
 * the Context-backed service facade; concrete RefSubject values own their own Scope and serialized
 * update boundary.
 *
 * @since 1.18.0
 * @category Writable state
 */
export declare namespace RefSubject {
  /**
   * Describes the any type.
   *
   * @remarks
   * ## Why
   *
   * Gives generic utilities one structural supertype for writable RefSubject values while leaving
   * concrete value, error, and service channels available to conditional types.
   *
   * ## Ownership and lifetime
   *
   * Any is a contract and performs no acquisition. Implementations retain the errors, services,
   * interruption, and Scope requirements expressed by its members.
   *
   * @since 1.18.0
   * @category Type utilities
   */
  export type Any =
    | RefSubject<any, any, any>
    | RefSubject<any, any>
    | RefSubject<any, never, any>
    | RefSubject<any>;

  /**
   * Defines the service state contract.
   *
   * @remarks
   * ## Why
   *
   * Describes the class-like facade returned by `RefSubject.Service`: it is a Context tag whose
   * static members also implement current reads, Fx observation, and serialized writes.
   *
   * ## Ownership and lifetime
   *
   * The contract itself acquires nothing. A matching Layer owns the underlying RefSubject; using
   * the facade requires `Self`, exposes the underlying `E` on reads and pushes, and forwards Scope
   * ownership to that installed subject.
   *
   * @since 1.18.0
   * @category Services
   */
  export interface Service<Self, Id extends string, A, E> extends RefSubject<A, E, Self> {
    /**
     * Exposes id on the ref subject contract.
     *
     * @remarks
     * ## Why
     *
     * Preserves the literal Context identifier used to construct and diagnose the service tag.
     *
     * ## Ownership and lifetime
     *
     * This declaration performs no acquisition and retains no resources. Implementations preserve
     * source errors, services, and lifetime.
     *
     * @since 1.18.0
     * @category Services
     */
    readonly id: Id;

    /**
     * Exposes service on the ref subject contract.
     *
     * @remarks
     * ## Why
     *
     * Exposes the exact Effect Context tag used by `layer`, `make`, and every static operation on
     * the facade, so custom Layers can install an existing RefSubject without another wrapper.
     *
     * ## Ownership and lifetime
     *
     * The tag is pure metadata and owns no state. The Layer that provides it owns the installed
     * RefSubject and its scoped initializer; operations retrieving it require `Self`.
     *
     * @since 1.18.0
     * @category Services
     */
    readonly service: Context.Service<Self, RefSubject<A, E>>;

    /**
     * Exposes make on the ref subject contract.
     *
     * @remarks
     * ## Why
     *
     * Accepts values, Effects, Streams, and Fx through one renderer-independent state constructor
     * while retaining their typed failures and services.
     *
     * ## Ownership and lifetime
     *
     * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
     * and cleanup; source failures and services stay on reads and pushes.
     *
     * @since 1.18.0
     * @category Constructors
     */
    readonly make: <R = never>(
      value: A | Effect.Effect<A, E, R> | Fx<A, E, R>,
      options?: RefSubjectOptions<A> & { readonly skip?: number; readonly take?: number },
    ) => Layer.Layer<Self, never, Exclude<R, Scope.Scope>>;

    /**
     * Exposes layer on the ref subject contract.
     *
     * @remarks
     * ## Why
     *
     * Converts a scoped Effect that produces a RefSubject into the exact Layer required by the
     * facade, preserving construction failures and non-Scope requirements.
     *
     * ## Ownership and lifetime
     *
     * Layer acquisition runs `make` once per Layer instance. Its Scope owns the installed subject;
     * `E2` is a Layer-construction failure, while the subject's `E` remains on later state access.
     *
     * @since 1.18.0
     * @category Service layers
     */
    readonly layer: <E2, R2>(
      make: Effect.Effect<RefSubject<A, E>, E2, R2 | Scope.Scope>,
    ) => Layer.Layer<Self, E2, Exclude<R2, Scope.Scope>>;
  }

  /**
   * Defines the class state contract.
   *
   * @remarks
   * ## Why
   *
   * Adds the construct signature used by class-extension syntax to the RefSubject service facade.
   *
   * ## Ownership and lifetime
   *
   * Class is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   * @since 1.18.0
   * @category Services
   */
  export interface Class<Self, Id extends string, A, E> extends RefSubject.Service<Self, Id, A, E> {
    /**
     * Construct signature used by the generated RefSubject service class.
     *
     * @remarks
     * ## Why
     *
     * Makes `class State extends RefSubject.Service(...)(id) {}` type-check while returning the
     * static facade rather than allocating a second state object.
     *
     * ## Ownership and lifetime
     *
     * Constructing the generated class returns its static service facade; it does not allocate or
     * acquire a RefSubject. The matching Layer owns the installed state and its Scope.
     *
     * @since 1.18.0
     * @category Type utilities
     */
    new (): RefSubject.Service<Self, Id, A, E>;
  }
}
/**
 * Selects whether a computed Fx observes only its current value or also follows later pushes.
 *
 * @remarks
 * ## Why
 *
 * `"multiple"` (the default) emits the current value and then follows distinct source pushes.
 * `"one"` emits only the current value. Hydration temporarily uses `"one"` when it must resolve a
 * single server value without leaving a live observation running.
 *
 * ## Ownership and lifetime
 *
 * This is an Effect Context reference with a default value, not mutable global state. Supplying a
 * value changes computed observation only in the provided Effect context; the observing Scope
 * still owns any subscription created by `"multiple"`.
 *
 * @since 1.18.0
 * @category Observation policy
 */
export const CurrentComputedBehavior = Context.Reference("@typed/fx/CurrentComputedBehavior", {
  defaultValue: (): "one" | "multiple" => "multiple",
});

const checkIsMultiple = (ctx: Context.Context<any>): ctx is Context.Context<"multiple"> =>
  Context.getUnsafe(ctx, CurrentComputedBehavior) === "multiple";

function holdInContext<A, E, R>(fx: Fx<A, E, R>): Fx<A, E, R | Scope.Scope> {
  const contexts = new WeakMap<Context.Context<R>, Fx<A, E, R | Scope.Scope>>();
  return unwrap(
    Effect.map(Effect.context<R>(), (context) => {
      let shared = contexts.get(context);
      if (!shared) {
        shared = Subject.hold(fx);
        contexts.set(context, shared);
      }
      return shared;
    }),
  );
}

class ComputedImpl<R0, E0, A, E, R, E2, R2, C, E3, R3>
  extends Versioned.VersionedTransform<
    R0,
    E0,
    A,
    E,
    R,
    A,
    E2,
    R2,
    C,
    E0 | E | E2 | E3,
    R0 | Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
    C,
    E0 | E | E2 | E3,
    R0 | Exclude<R, Scope.Scope> | R2 | R3
  >
  implements Computed<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  private _computed: Fx<C, E0 | E | E2 | E3, R0 | R | Scope.Scope | R2 | R3>;

  override input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>;
  readonly f: (a: A) => Effect.Effect<C, E3, R3>;

  constructor(
    input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<C, E3, R3>,
  ) {
    super(input, (fx) => fxMapEffect(fx, f) as any, Effect.flatMap(f));

    this.input = input;
    this.f = f;

    this._computed = holdInContext(
      unwrap(
        Effect.map(Effect.context(), (ctx) => {
          if (checkIsMultiple(ctx)) {
            return fxFromEffect(input).pipe(
              continueWith(() => input),
              skipRepeats,
              fxMapEffect(f),
            );
          }

          return fxFromEffect(Effect.flatMap(input, f));
        }),
      ),
    );
  }

  override run<RSink>(sink: Sink.Sink<C, E0 | E | E2 | E3, RSink>) {
    return this._computed.run(sink) as any;
  }
}

/**
 * Builds a read-only Computed projection from a Versioned source.
 *
 * @remarks
 * ## Why
 *
 * Applies the same Effectful projection to current reads and pushed versions, preserving all three
 * Versioned channels without granting writes to the source.
 *
 * ## Ownership and lifetime
 *
 * Current reads cache the transformed input by source version within each Effect Context. The
 * pushed channel uses `Subject.hold`: observers with the same Context object share one upstream
 * session and its retained projection; distinct Context objects have separate sessions. The last
 * observer ends its session and clears its held value. The observing Scope owns cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export function makeComputed<R0, E0, A, E, R, E2, R2, C, E3, R3>(
  input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => Effect.Effect<C, E3, R3>,
): Computed<C, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>> {
  return new ComputedImpl(input, f);
}

/**
 * Stateful scan over a `RefSubject` / `Computed`, producing a `Computed` of the accumulated state.
 *
 * Fx subscriptions follow `Fx.scan` semantics (emit `initial`, then fold each source value).
 * Effect sampling accumulates across source versions via a private state ref (do not mix heavy
 * subscribe + sample on the same scan if you need a single shared accumulator).
 *
 * @remarks
 * ## Why
 *
 * Stateful scan over a `RefSubject` / `Computed`, producing a `Computed` of the accumulated state.
 * Fx subscriptions follow `Fx.scan` semantics (emit `initial`, then fold each source value).
 * Effect sampling accumulates across source versions via a private state ref (do not mix heavy
 * subscribe + sample on the same scan if you need a single shared accumulator). The result remains
 * a lazy view rather than a duplicated mutable value.
 *
 * ## Ownership and lifetime
 *
 * Each Effect Context object gets a private current-read accumulator, advanced after a successful
 * fold for a new source version. The pushed channel runs `Fx.scanEffect` from `initial` inside
 * `Subject.hold`: observers using the same Context share that active scan and retained result.
 * The last observer ends its session and clears its held value. The observing Scope owns
 * subscription cleanup. Read accumulators are weakly held by Context and need no finalizer.
 *
 * @since 1.0.0
 * @category Accumulation
 */
export const scan: {
  <S, A>(
    initial: S,
    f: (s: S, a: A) => S,
  ): <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>) => Computed<S, E, R>;

  <A, E, R, S>(
    ref: RefSubject<A, E, R> | Computed<A, E, R>,
    initial: S,
    f: (s: S, a: A) => S,
  ): Computed<S, E, R>;

  <R0, E0, A, E, R, E2, R2, S>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    initial: S,
    f: (s: S, a: A) => S,
  ): Computed<S, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>;
} = dual(3, function scan<
  R0,
  E0,
  A,
  E,
  R,
  E2,
  R2,
  S,
>(versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>, initial: S, f: (s: S, a: A) => S): Computed<
  S,
  E0 | E | E2,
  R0 | R2 | Exclude<R, Scope.Scope>
> {
  return new ComputedScanImpl(versioned, initial, (s, a) => Effect.succeed(f(s, a)));
});

/**
 * Effectful stateful scan over a `RefSubject` / `Computed`, producing a `Computed` of the accumulated state.
 *
 * @remarks
 * ## Why
 *
 * Effectful stateful scan over a `RefSubject` / `Computed`, producing a `Computed` of the
 * accumulated state. The result remains a lazy view rather than a duplicated mutable value.
 *
 * ## Ownership and lifetime
 *
 * Each Effect Context object gets a private current-read accumulator. It advances only after `f`
 * succeeds, so a typed failure leaves the previous state intact. The pushed channel runs
 * `Fx.scanEffect` from `initial` inside `Subject.hold`: observers using the same Context share
 * that active scan and retained result; each fold requires `R3`. The last observer ends its
 * session and clears its held value. The observing Scope owns cleanup. Read accumulators are
 * weakly held by Context and need no finalizer.
 *
 * @since 1.0.0
 * @category Accumulation
 */
export const scanEffect: {
  <S, A, E3, R3>(
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E3, R3>,
  ): <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>) => Computed<S, E | E3, R | R3>;

  <A, E, R, S, E3, R3>(
    ref: RefSubject<A, E, R> | Computed<A, E, R>,
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E3, R3>,
  ): Computed<S, E | E3, R | R3>;

  <R0, E0, A, E, R, E2, R2, S, E3, R3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E3, R3>,
  ): Computed<S, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>;
} = dual(3, function scanEffect<
  R0,
  E0,
  A,
  E,
  R,
  E2,
  R2,
  S,
  E3,
  R3,
>(versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>, initial: S, f: (s: S, a: A) => Effect.Effect<S, E3, R3>): Computed<
  S,
  E0 | E | E2 | E3,
  R0 | R2 | R3 | Exclude<R, Scope.Scope>
> {
  return new ComputedScanImpl(versioned, initial, f);
});

class ComputedScanImpl<R0, E0, A, E, R, E2, R2, S, E3, R3>
  extends Versioned.VersionedTransform<
    R0,
    E0,
    A,
    E,
    R,
    A,
    E2,
    R2,
    S,
    E0 | E | E2 | E3,
    R0 | Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
    S,
    E0 | E | E2 | E3,
    R0 | Exclude<R, Scope.Scope> | R2 | R3
  >
  implements Computed<S, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  private _computed: Fx<S, E0 | E | E2 | E3, R0 | R | Scope.Scope | R2 | R3>;

  override input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>;
  readonly initial: S;
  readonly f: (s: S, a: A) => Effect.Effect<S, E3, R3>;

  constructor(
    input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E3, R3>,
  ) {
    const states = new WeakMap<Context.Context<never>, MutableRef.MutableRef<S>>();

    super(
      input,
      (fx) => fxScanEffect(fx, initial, f) as any,
      (effect) =>
        Effect.contextWith((context) => {
          let state = states.get(context);
          if (!state) {
            state = MutableRef.make(initial);
            states.set(context, state);
          }
          const current = state;
          return Effect.flatMap(effect, (a) =>
            Effect.flatMap(f(MutableRef.get(current), a), (next) =>
              Effect.sync(() => {
                MutableRef.set(current, next);
                return next;
              }),
            ),
          );
        }),
    );

    this.input = input;
    this.initial = initial;
    this.f = f;

    this._computed = holdInContext(
      unwrap(
        Effect.map(Effect.context(), (ctx) => {
          if (checkIsMultiple(ctx)) {
            return fxFromEffect(input).pipe(
              continueWith(() => input),
              skipRepeats,
              fxScanEffect(initial, f),
            );
          }

          return fxFromEffect(Effect.flatMap(input, (a) => f(initial, a)));
        }),
      ),
    );
  }

  override run<RSink>(sink: Sink.Sink<S, E0 | E | E2 | E3, RSink>) {
    return this._computed.run(sink) as any;
  }
}

/**
 * Builds a Filtered view from the three channels of a Versioned source.
 *
 * @remarks
 * ## Why
 *
 * Applies `f` to current reads and later pushes while preserving absence as Filtered semantics:
 * Effect reads fail with `NoSuchElementError`, whereas the Fx channel simply omits absent values.
 *
 * ## Ownership and lifetime
 *
 * Sampled results and pushed sessions are isolated by Effect Context identity. Within one Context,
 * current reads cache by source version and observers share the active held projection. Its
 * Effect read fails with NoSuchElement while absent; the observing Scope owns its subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export function makeFiltered<R0, E0, A, E, R, E2, R2, C, E3, R3>(
  input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>,
): Filtered<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3> {
  return new FilteredImpl(input, f);
}

class FilteredImpl<R0, E0, A, E, R, E2, R2, C, E3, R3>
  extends Versioned.VersionedTransform<
    R0,
    E0,
    A,
    E,
    R,
    A,
    E2,
    R2,
    C,
    E0 | E | E2 | E3,
    R0 | Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
    C,
    E0 | E | E2 | E3 | Cause.NoSuchElementError,
    R0 | Exclude<R, Scope.Scope> | R2 | R3
  >
  implements Filtered<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3>
{
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId;
  private _computed: Fx<C, E0 | E | E2 | E3, R0 | R | Scope.Scope | R2 | R3>;

  override input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>;
  readonly f: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>;

  constructor(
    input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>,
  ) {
    super(
      input,
      (fx) => fxFilterMapEffect(fx, f) as any,
      (effect) => Effect.flatMap(Effect.flatMap(effect, f), Effect.fromOption),
    );

    this.input = input;
    this.f = f;

    this._computed = holdInContext(
      unwrap(
        Effect.map(Effect.context(), (ctx) => {
          if (checkIsMultiple(ctx)) {
            return fxFromEffect(input).pipe(
              continueWith(() => input),
              skipRepeats,
              fxFilterMapEffect(f),
            );
          }

          return fxCompact(fxFromEffect(Effect.flatMap(input, f)));
        }),
      ),
    );
  }

  override run<RSink>(sink: Sink.Sink<C, E0 | E | E2 | E3, RSink>) {
    return this._computed.run(sink) as any;
  }

  asComputed(): Computed<
    Option.Option<C>,
    E0 | E | E2 | E3,
    R0 | R2 | R3 | Exclude<R, Scope.Scope>
  > {
    return new ComputedImpl(this.input, this.f);
  }
}

let nextTransactionOrder = 0;

class RefSubjectCore<A, E, R, R2> {
  readonly initial: Effect.Effect<A, E, R>;
  readonly subject: Subject.HoldSubjectImpl<A, E>;
  readonly services: Context.Context<R2>;
  readonly scope: Scope.Closeable;
  readonly deferredRef: DeferredRef.DeferredRef<E, A>;
  readonly semaphore: Semaphore.Semaphore;
  readonly transactionOrder = nextTransactionOrder++;
  constructor(
    initial: Effect.Effect<A, E, R>,
    subject: Subject.HoldSubjectImpl<A, E>,
    services: Context.Context<R2>,
    scope: Scope.Closeable,
    deferredRef: DeferredRef.DeferredRef<E, A>,
    semaphore: Semaphore.Semaphore,
  ) {
    this.initial = initial;
    this.subject = subject;
    this.services = services;
    this.scope = scope;
    this.deferredRef = deferredRef;
    this.semaphore = semaphore;
  }

  public _fiber: Fiber.Fiber<A, E> | undefined = undefined;
}

type RecordCommit<A, E> = (exit: Exit.Exit<A, E>) => void;

type AnyRefSubjectCore = RefSubjectCore<any, any, any, any>;

type TransactionCommit = readonly [
  core: AnyRefSubjectCore,
  exit: Exit.Exit<any, any>,
  version: number,
];

interface TransactionAccess {
  readonly cores: ReadonlyArray<AnyRefSubjectCore>;
  readonly getSetDelete: (
    recordCommit: (commit: TransactionCommit) => void,
  ) => GetSetDelete<any, any, any>;
}

type TransactionAccessEffect = Effect.Effect<Option.Option<TransactionAccess>, never, any>;

function combineTransactionCores(
  accesses: ReadonlyArray<TransactionAccess>,
): ReadonlyArray<AnyRefSubjectCore> {
  return [...new Set(accesses.flatMap((access) => access.cores))].sort(
    (left, right) => left.transactionOrder - right.transactionOrder,
  );
}

function getTupleTransactionAccess(
  refs: ReadonlyArray<RefSubject.Any>,
): TransactionAccessEffect | undefined {
  const accessEffects = refs.map(getTransactionAccess);
  if (!accessEffects.every((access): access is TransactionAccessEffect => access !== undefined)) {
    return undefined;
  }

  return Effect.map(Effect.all(accessEffects, UNBOUNDED), (accessOptions) =>
    Option.map(Option.all(accessOptions), (accesses) => ({
      cores: combineTransactionCores(accesses),
      getSetDelete: (recordCommit: (commit: TransactionCommit) => void) => {
        const transactions = accesses.map((access) => access.getSetDelete(recordCommit));
        return {
          get: Effect.all(
            transactions.map((transaction) => transaction.get),
            UNBOUNDED,
          ),
          set: (value: ReadonlyArray<any>) =>
            Effect.all(
              transactions.map((transaction, index) => transaction.set(value[index])),
              UNBOUNDED,
            ),
          delete: Effect.map(
            Effect.all(
              transactions.map((transaction) => transaction.delete),
              UNBOUNDED,
            ),
            Option.all,
          ),
        };
      },
    })),
  );
}

function getStructTransactionAccess(
  refs: Readonly<Record<string, RefSubject.Any>>,
): TransactionAccessEffect | undefined {
  const keys = Object.keys(refs);
  const accessEffects = keys.map((key) => getTransactionAccess(refs[key]));
  if (!accessEffects.every((access): access is TransactionAccessEffect => access !== undefined)) {
    return undefined;
  }

  return Effect.map(Effect.all(accessEffects, UNBOUNDED), (accessOptions) =>
    Option.map(Option.all(accessOptions), (accesses) => ({
      cores: combineTransactionCores(accesses),
      getSetDelete: (recordCommit: (commit: TransactionCommit) => void) => {
        const transactions = accesses.map((access) => access.getSetDelete(recordCommit));
        return {
          get: Effect.map(
            Effect.all(
              transactions.map((transaction) => transaction.get),
              UNBOUNDED,
            ),
            (values) => Object.fromEntries(keys.map((key, index) => [key, values[index]])),
          ),
          set: (value: Readonly<Record<string, any>>) =>
            Effect.all(
              transactions.map((transaction, index) => transaction.set(value[keys[index]])),
              UNBOUNDED,
            ),
          delete: Effect.map(
            Effect.all(
              transactions.map((transaction) => transaction.delete),
              UNBOUNDED,
            ),
            (values) =>
              Option.all(Object.fromEntries(keys.map((key, index) => [key, values[index]]))),
          ),
        };
      },
    })),
  );
}

function getTransactionAccess(ref: RefSubject.Any): TransactionAccessEffect | undefined {
  if (ref instanceof RefSubjectImpl) {
    return Effect.succeed(
      Option.some({
        cores: [ref.core],
        getSetDelete: (recordCommit: (commit: TransactionCommit) => void) =>
          getSetDelete(ref.core, (exit) =>
            recordCommit([ref.core, exit, ref.core.deferredRef.version]),
          ),
      }),
    );
  }

  if (ref instanceof RefSubjectSimpleTransform) return getTransactionAccess(ref.ref);

  if (ref instanceof RefSubjectTransform) {
    const accessEffect = getTransactionAccess(ref.ref);
    if (!accessEffect) return undefined;

    return Effect.map(
      accessEffect,
      Option.map((access) => ({
        cores: access.cores,
        getSetDelete: (recordCommit: (commit: TransactionCommit) => void) => {
          const transaction = access.getSetDelete(recordCommit);
          return {
            get: Effect.map(transaction.get, ref.toB),
            set: (value: any) => Effect.map(transaction.set(ref.toA(value)), ref.toB),
            delete: Effect.map(transaction.delete, Option.map(ref.toB)),
          };
        },
      })),
    );
  }

  if (ref instanceof RefSubjectTuple) return getTupleTransactionAccess(ref.refs);
  if (ref instanceof RefSubjectStruct) return getStructTransactionAccess(ref.refs);

  if (typeof ref === "function") {
    const service = (ref as any).service as Effect.Effect<RefSubject.Any, never, any>;
    if (Effect.isEffect(service)) {
      return Effect.flatMap(service, (providedRef) => {
        const accessEffect = getTransactionAccess(providedRef);
        return accessEffect ?? Effect.succeed(Option.none());
      });
    }
  }

  return undefined;
}

function withTransactionLocks<A, E, R>(
  cores: ReadonlyArray<AnyRefSubjectCore>,
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> {
  let locked = effect;

  for (let index = cores.length - 1; index >= 0; index--) {
    locked = cores[index].semaphore.withPermits(1)(locked);
  }

  return locked;
}

function runTransaction<A, E, R>(
  access: TransactionAccess,
  run: (ref: GetSetDelete<any, any, any>) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> {
  return Effect.uninterruptibleMask((restore) => {
    const commits: TransactionCommit[] = [];
    const transaction = restore(
      withTransactionLocks(
        access.cores,
        Effect.suspend(() =>
          run(
            access.getSetDelete((commit) => {
              commits.push(commit);
            }),
          ),
        ),
      ),
    );

    return Effect.flatMap(Effect.exit(transaction), (exit) =>
      Effect.andThen(
        Effect.forEach(
          commits,
          ([core, commit, version]) => sendCurrentEvent(core, commit, version),
          {
            discard: true,
          },
        ),
        exit,
      ),
    );
  }) as Effect.Effect<A, E, R>;
}

function sendCurrentEvent(
  core: AnyRefSubjectCore,
  commit: Exit.Exit<any, any>,
  version: number,
): Effect.Effect<unknown, never, any> {
  return Effect.suspend(() => {
    const current = MutableRef.get(core.deferredRef.current);
    return core.deferredRef.version === version &&
      Option.isSome(current) &&
      core.deferredRef.eq(current.value, commit)
      ? sendEvent(core, commit)
      : Effect.void;
  });
}

/**
 * Defines the ref subject options state contract.
 *
 * @remarks
 * ## Why
 *
 * Configures equality for committed RefSubject values.
 *
 * ## Ownership and lifetime
 *
 * RefSubjectOptions is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Construction options
 */
export interface RefSubjectOptions<A> {
  /**
   * Optional equivalence used to suppress unchanged commits.
   *
   * @remarks
   * ## Why
   *
   * Suppresses publication and version changes when a candidate value is equivalent to the
   * currently committed value.
   *
   * ## Ownership and lifetime
   *
   * This declaration performs no acquisition and retains no resources. Implementations preserve
   * source errors, services, and lifetime.
   *
   * @since 1.18.0
   * @category Equality
   */
  readonly eq?: Equivalence<A>;
}

function getSetDelete<A, E, R, R2>(
  ref: RefSubjectCore<A, E, R, R2>,
  recordCommit: RecordCommit<A, E>,
): GetSetDelete<A, E, Exclude<R, R2>> {
  return {
    get: getOrInitializeCore(ref, false),
    set: (a) => bufferSuccessCore(ref, a, recordCommit),
    delete: deleteCore(ref),
  };
}
class RefSubjectImpl<A, E, R, R2>
  extends YieldableFx<A, E, Exclude<R, R2> | Scope.Scope, A, E, Exclude<R, R2>>
  implements RefSubject<A, E, Exclude<R, R2>>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  readonly version: Effect.Effect<number>;
  readonly interrupt: Effect.Effect<void, never, Exclude<R, R2>>;
  readonly subscriberCount: Effect.Effect<number, never, Exclude<R, R2>>;

  readonly core: RefSubjectCore<A, E, R, R2>;

  constructor(core: RefSubjectCore<A, E, R, R2>) {
    super();

    this.core = core;
    this.version = Effect.sync(() => core.deferredRef.version);
    this.interrupt = Effect.provide(interruptCore(core), core.services);
    this.subscriberCount = Effect.provide(core.subject.subscriberCount, core.services);

    this.updates = this.updates.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  run<R3>(
    sink: Sink.Sink<A, E, R3>,
  ): Effect.Effect<unknown, never, Exclude<R, R2> | R3 | Scope.Scope> {
    const subscribe = Effect.provide(this.core.subject.run(sink), this.core.services);
    return Effect.matchCauseEffect(getOrInitializeCore(this.core, true), {
      onFailure: () => subscribe,
      onSuccess: () => subscribe,
    });
  }

  updates<R3, E3, B>(run: (ref: GetSetDelete<A, E, Exclude<R, R2>>) => Effect.Effect<B, E3, R3>) {
    return updateCore(this.core, (recordCommit) => run(getSetDelete(this.core, recordCommit)));
  }

  onSuccess(value: A): Effect.Effect<unknown, never, Exclude<R, R2>> {
    return updateCore(this.core, (recordCommit) =>
      bufferSuccessCore(this.core, value, recordCommit),
    );
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, Exclude<R, R2>> {
    return updateCore(this.core, (recordCommit) =>
      bufferFailureCore(this.core, cause, recordCommit),
    );
  }

  toEffect(): Effect.Effect<A, E, Exclude<R, R2>> {
    return getOrInitializeCore(this.core, true);
  }
}

/**
 * Creates a new `RefSubject` from a value, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * `RefSubject` keeps current state and pushed changes independent of any UI
 * renderer. Domain transitions can therefore be constructed, composed, and
 * tested with Effect alone; rendering is one optional consumer of the state.
 * Plain values, Effect programs, pull-based Effect `Stream`s, and push-based
 * `Fx` sources all enter through the same state boundary.
 *
 * ## Ownership and lifetime
 *
 * Creation requires an Effect `Scope`. That scope owns source acquisition,
 * subscriptions, and finalization. The returned `RefSubject` exposes the
 * source error type when read or observed, while construction itself cannot
 * fail. Closing the scope interrupts a live source and releases its resources.
 *
 * ## Initialization
 *
 * Calling `make` is lazy because it returns an Effect: nothing is allocated and no source runs
 * until that creation Effect is executed. After creation, a plain value is immediately available.
 * An Effect input runs once on the first current read or observation. Fx and Stream inputs instead
 * start one shared source run when the creation Effect executes; reads wait for their first value
 * or failure and later emissions replace the retained current state. Equality and buffering
 * behavior can be customized with `RefSubjectOptions`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 * import { Fx } from "@typed/fx"
 *
 * // From a plain value
 * const program1 = Effect.gen(function* () {
 *   const ref = yield* RefSubject.make(42)
 *   const value = yield* ref
 *   console.log(value) // 42
 * })
 *
 * // From an Effect
 * const program2 = Effect.gen(function* () {
 *   const ref = yield* RefSubject.make(
 *     Effect.succeed("Hello")
 *   )
 *   const value = yield* ref
 *   console.log(value) // "Hello"
 * })
 *
 * // From an Fx (tracks the latest value)
 * const program3 = Effect.gen(function* () {
 *   const ref = yield* RefSubject.make(
 *     Fx.fromIterable([1, 2, 3])
 *   )
 *   const value = yield* ref
 *   console.log(value) // 3 (latest value)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Constructors
 */
export function make<A, E = never, R = never>(
  effect: A | Effect.Effect<A, E, R> | Stream.Stream<A, E, R> | Fx<A, E, R>,
  options?: RefSubjectOptions<A>,
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope> {
  if (isFx(effect)) {
    return fromFx(effect, options);
  } else if (Effect.isEffect(effect)) {
    return fromEffect(effect, options);
  } else if (Stream.isStream(effect)) {
    return fromStream(effect, options);
  } else {
    return fromEffect<A, E, R>(Effect.succeed(effect), options);
  }
}

/**
 * Creates a `RefSubject` from an `Effect`.
 *
 * @remarks
 * ## Why
 *
 * Makes effect acquisition explicit while normalizing it into current RefSubject state and
 * subsequent pushed versions.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope and the source's services, which it captures for the private
 * initializer Scope. The source Effect itself stays deferred until the first current read or
 * observation and runs at most once. Source failures remain visible on reads and observations;
 * closing the creation Scope interrupts an initializer that is still running.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const ref = yield* RefSubject.fromEffect(
 *     Effect.succeed("Initial value")
 *   )
 *
 *   const value = yield* ref
 *   console.log(value) // "Initial value"
 * })
 * ```
 *
 * @since 1.0.0
 * @category Source adapters
 */
export function fromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options?: RefSubjectOptions<A>,
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope> {
  return Effect.map(makeCore(effect, options), (core) => new RefSubjectImpl(core));
}

/**
 * Creates a `RefSubject` from an `Fx`, tracking the latest emitted value.
 *
 * @remarks
 * ## Why
 *
 * Makes fx acquisition explicit while normalizing it into current RefSubject state and subsequent
 * pushed versions.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   // Create an Fx that emits multiple values
 *   const numbers = Fx.fromIterable([1, 2, 3, 4, 5])
 *
 *   // Create a RefSubject that tracks the latest value
 *   const ref = yield* RefSubject.fromFx(numbers)
 *
 *   // Get the latest value
 *   const latest = yield* ref
 *   console.log(latest) // 5
 * })
 * ```
 *
 * @since 1.0.0
 * @category Source adapters
 */
export function fromFx<A, E, R>(
  fx: Fx<A, E, R>,
  options?: RefSubjectOptions<A>,
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope> {
  return Effect.gen(function* () {
    const core = yield* makeDeferredCore<A, E, R>(options);
    const ref = new RefSubjectImpl(core);
    yield* Effect.forkIn(
      fx.run(
        Sink.make(
          (cause) =>
            updateCore(core, (recordCommit) => bufferFailureCore(core, cause, recordCommit)),
          (value) =>
            updateCore(core, (recordCommit) => bufferSuccessCore(core, value, recordCommit)),
        ),
      ),
      core.scope,
      { startImmediately: true },
    );
    return ref;
  });
}

/**
 * Creates a RefSubject that tracks the latest value emitted by an Effect Stream.
 *
 * @remarks
 * ## Why
 *
 * Bridges a pull-based Stream into renderer-independent state: each emitted value enters the
 * RefSubject's serialized commit path, while a stream failure becomes the ref's current and pushed
 * failure.
 *
 * ## Ownership and lifetime
 *
 * Construction forks stream consumption immediately into the RefSubject's private Scope and cannot
 * fail. `R` is required while constructing that fiber; closing the outer Scope interrupts it.
 * Before the first value or failure, a current read waits for initialization. Later reads and pushes
 * expose `E`.
 *
 * @since 1.18.0
 * @category Source adapters
 */
export function fromStream<A, E, R>(
  stream: Stream.Stream<A, E, R>,
  options?: RefSubjectOptions<A>,
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope> {
  return Effect.gen(function* () {
    const core = yield* makeDeferredCore<A, E, R>(options);
    const ref = new RefSubjectImpl(core);
    yield* Effect.forkIn(
      stream.pipe(
        redirectCause(core),
        Stream.runForEach((value) =>
          updateCore(core, (recordCommit) => bufferSuccessCore(core, value, recordCommit)),
        ),
      ),
      core.scope,
      { startImmediately: true },
    );
    return ref;
  });
}

/**
 * Creates a `RefSubject` from an `Option` value.
 *
 * @remarks
 * ## Why
 *
 * Stores the Option itself in writable state. `None` is an ordinary current value and does not add
 * `NoSuchElementError`; callers opt into absence semantics with `compact`, or a fallback with
 * `getOrElse`.
 *
 * ## Ownership and lifetime
 *
 * Construction requires Scope because it delegates to `make`, but the supplied Option needs no
 * services and cannot fail. The returned RefSubject owns and publishes subsequent Option writes.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const ref = yield* RefSubject.fromOption(Option.some(42))
 *   const value = yield* ref
 *   console.log(Option.isSome(value)) // true
 * })
 * ```
 *
 * @since 1.0.0
 * @category Source adapters
 */
export function fromOption<A>(
  option: Option.Option<A>,
  options?: RefSubjectOptions<Option.Option<A>>,
): Effect.Effect<RefSubject<Option.Option<A>>, never, Scope.Scope> {
  return make(option, options);
}

/**
 * Creates a `RefSubject` from a nullable value (null/undefined become `Option.none()`).
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const ref = yield* RefSubject.fromNullable("hello")
 *   const value = yield* ref
 *   console.log(Option.isSome(value)) // true
 *
 *   const empty = yield* RefSubject.fromNullable(null)
 *   const none = yield* empty
 *   console.log(Option.isNone(none)) // true
 * })
 * ```
 *
 * @since 1.0.0
 * @category Source adapters
 */
function optionFromNullable<A>(value: A | null | undefined): Option.Option<NonNullable<A>> {
  return value === null || value === undefined
    ? Option.none()
    : Option.some(value as NonNullable<A>);
}

/**
 * Creates Option-valued RefSubject state from a nullable input.
 *
 * @remarks
 * ## Why
 *
 * Converts `null` and `undefined` to `Option.none` and every other value to `Option.some`, then
 * stores that Option in a writable RefSubject. It does not create Filtered state or add
 * `NoSuchElementError`.
 *
 * ## Ownership and lifetime
 *
 * Construction requires Scope because it delegates to `make`; it needs no services and cannot
 * fail. The returned RefSubject owns and publishes subsequent Option writes.
 *
 * @since 1.18.0
 * @category Source adapters
 */
export function fromNullable<A>(
  value: A | null | undefined,
  options?: RefSubjectOptions<Option.Option<NonNullable<A>>>,
): Effect.Effect<RefSubject<Option.Option<NonNullable<A>>>, never, Scope.Scope> {
  return make(optionFromNullable(value), options);
}

function redirectCause<A, E, R>(core: RefSubjectCore<A, E, R, R | Scope.Scope>) {
  return Stream.catchCause((cause: Cause.Cause<E>) =>
    Stream.unwrap(
      Effect.as(
        updateCore(core, (recordCommit) => bufferFailureCore(core, cause, recordCommit)),
        Stream.empty,
      ),
    ),
  );
}

function makeCore<A, E, R>(
  initial: Effect.Effect<A, E, R>,
  options?: RefSubjectOptions<A>,
  deferredRef?: DeferredRef.DeferredRef<E, A>,
) {
  return Effect.gen(function* () {
    const services = yield* Effect.context<R | Scope.Scope>();
    const scope = yield* Scope.fork(Context.get(services, Scope.Scope));
    const id = yield* Effect.withFiber((fiber) => Effect.succeed(fiber.id));
    const subject = new Subject.HoldSubjectImpl<A, E>();
    const core = new RefSubjectCore(
      initial,
      subject,
      services,
      scope,
      deferredRef ??
        DeferredRef.unsafeMake(id, getExitEquivalence(options?.eq ?? equals), subject.lastValue),
      Semaphore.makeUnsafe(1),
    );
    yield* Scope.addFinalizer(scope, core.subject.interrupt);
    return core;
  });
}

function makeDeferredCore<A, E = never, R = never>(options?: RefSubjectOptions<A>) {
  return Effect.gen(function* () {
    const deferredRef = yield* DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? equals));
    return yield* makeCore<A, E, R>(deferredRef, options, deferredRef);
  });
}

function getOrInitializeCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lockInitialize: boolean,
): Effect.Effect<A, E, Exclude<R, R2>> {
  return Effect.suspend(() => {
    if (core._fiber === undefined && Option.isNone(MutableRef.get(core.deferredRef.current))) {
      return initializeCoreAndTap(core, lockInitialize);
    } else {
      return core.deferredRef;
    }
  });
}

function initializeCoreEffect<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lock: boolean,
): Effect.Effect<Fiber.Fiber<A, E>, never, Exclude<R, R2>> {
  let completed = false;
  const initialize = Effect.onExit(Effect.provide(core.initial, core.services), (exit) =>
    Effect.sync(() => {
      completed = true;
      core._fiber = undefined;
      core.deferredRef.done(exit);
    }),
  );

  const isSourceBacked = core.initial === core.deferredRef;

  return Effect.flatMap(
    Effect.forkIn(
      lock && !isSourceBacked ? core.semaphore.withPermits(1)(initialize) : initialize,
      core.scope,
      // Acquire the initializer's permit before a competing update can hold it while awaiting us.
      { startImmediately: true },
    ),
    (fiber) =>
      Effect.sync(() => {
        // A synchronous initializer has already cleared its ownership in onExit.
        if (!completed) core._fiber = fiber;
        return fiber;
      }),
  );
}

function initializeCoreAndTap<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lock: boolean,
): Effect.Effect<A, E, Exclude<R, R2>> {
  return Effect.flatMapEager(initializeCoreEffect(core, lock), () =>
    // Kind of weird hack, but this second clause will happen for HydrationRefs that are already hydrated
    core.deferredRef.current === core.subject.lastValue
      ? tapEventCore(core, core.deferredRef)
      : core.deferredRef,
  );
}

function updateCore<A, E, R, R2, B, E2, R3>(
  core: RefSubjectCore<A, E, R, R2>,
  run: (recordCommit: RecordCommit<A, E>) => Effect.Effect<B, E2, R3>,
): Effect.Effect<B, E2, Exclude<R, R2> | R3> {
  return Effect.uninterruptibleMask((restore) => {
    const commits: Exit.Exit<A, E>[] = [];
    const transaction = restore(
      core.semaphore.withPermits(1)(
        Effect.suspend(() =>
          run((commit) => {
            commits.push(commit);
          }),
        ),
      ),
    );

    return Effect.flatMap(Effect.exit(transaction), (exit) =>
      Effect.andThen(
        Effect.forEach(commits, (commit) => sendEvent(core, commit), { discard: true }),
        exit,
      ),
    );
  });
}

function setCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  a: A,
): Effect.Effect<Option.Option<Exit.Exit<A, E>>> {
  return Effect.suspend(() => {
    const exit = Exit.succeed(a);

    if (core.deferredRef.done(exit)) {
      return Effect.succeed(Option.some(exit));
    } else {
      return Effect.succeed(Option.none());
    }
  });
}

function onFailureCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  cause: Cause.Cause<E>,
): Effect.Effect<Option.Option<Exit.Exit<A, E>>> {
  const exit = Exit.failCause(cause);

  return Effect.suspend(() => {
    if (core.deferredRef.done(exit)) {
      return Effect.succeed(Option.some(exit));
    } else {
      return Effect.succeed(Option.none());
    }
  });
}

function bufferSuccessCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  value: A,
  recordCommit: RecordCommit<A, E>,
): Effect.Effect<A> {
  return Effect.map(setCore(core, value), (commit) => {
    if (Option.isSome(commit)) recordCommit(commit.value);
    return value;
  });
}

function bufferFailureCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  cause: Cause.Cause<E>,
  recordCommit: RecordCommit<A, E>,
): Effect.Effect<void> {
  return Effect.asVoid(
    Effect.map(onFailureCore(core, cause), (commit) => {
      if (Option.isSome(commit)) recordCommit(commit.value);
    }),
  );
}

function interruptCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
): Effect.Effect<void, never, R> {
  return Effect.withFiber((fiber) => {
    core.deferredRef.reset();

    const closeScope = Scope.close(core.scope, Exit.interrupt(fiber.id));
    const interruptFiber = core._fiber ? Fiber.interrupt(core._fiber) : Effect.void;
    const interruptSubject = core.subject.interrupt;

    return Effect.all([closeScope, interruptFiber, interruptSubject], { discard: true });
  });
}

function deleteCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
): Effect.Effect<Option.Option<A>, E, Exclude<R, R2>> {
  return Effect.suspend(() => {
    const current = MutableRef.get(core.deferredRef.current);
    core.deferredRef.reset();

    if (Option.isNone(current)) {
      return Effect.succeed(Option.none());
    }

    return core.subject.subscriberCount.pipe(
      Effect.flatMap((count: number) =>
        count > 0 && !core._fiber ? initializeCoreEffect(core, false) : Effect.void,
      ),
      Effect.flatMap(() => Effect.asSome(current.value)),
    );
  });
}

function tapEventCore<A, E, R, R2, R3>(
  core: RefSubjectCore<A, E, R, R2>,
  effect: Effect.Effect<A, E, R3>,
) {
  return effect.pipe(Effect.onExit((exit) => sendEvent(core, exit)));
}

function sendEvent<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  exit: Exit.Exit<A, E>,
): Effect.Effect<unknown, never, Exclude<R, R2>> {
  if (Exit.isSuccess(exit)) {
    return core.subject.onSuccess(exit.value);
  } else {
    return core.subject.onFailure(exit.cause);
  }
}

/**
 * Sets the value of a `RefSubject`.
 *
 * @remarks
 * ## Why
 *
 * Sets the value of a `RefSubject`. The transition is serialized at the RefSubject rather than
 * coordinated by callers or UI components.
 *
 * ## Ownership and lifetime
 *
 * Running set performs one serialized subject transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   // Set the value
 *   yield* RefSubject.set(count, 10)
 *   const value = yield* count
 *   console.log(value) // 10
 *
 *   // Can also use pipe syntax
 *   yield* count.pipe(RefSubject.set(20))
 *   const newValue = yield* count
 *   console.log(newValue) // 20
 * })
 * ```
 *
 * @since 1.0.0
 * @category State updates
 */
export const set: {
  <A>(value: A): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E, R>;
  <A, E, R>(ref: RefSubject<A, E, R>, a: A): Effect.Effect<A, E, R>;
} = dual(2, function set<A, E, R>(ref: RefSubject<A, E, R>, a: A): Effect.Effect<A, E, R> {
  return ref.updates((ref) => ref.set(a));
});

/**
 * Resets a `RefSubject` to its initial value, returning the previous value if it existed.
 *
 * @remarks
 * ## Why
 *
 * Resets a `RefSubject` to its initial value, returning the previous value if it existed. The
 * transition is serialized at the RefSubject rather than coordinated by callers or UI components.
 *
 * ## Ownership and lifetime
 *
 * Running reset performs one serialized subject transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   yield* RefSubject.set(count, 5)
 *   const before = yield* count
 *   console.log(before) // 5
 *
 *   // Reset to initial value
 *   const previous = yield* RefSubject.reset(count)
 *   console.log(Option.isSome(previous)) // true
 *   console.log(previous.value) // 5
 *
 *   const after = yield* count
 *   console.log(after) // 0
 * })
 * ```
 *
 * @since 1.0.0
 * @category State updates
 */
export function reset<A, E, R>(ref: RefSubject<A, E, R>): Effect.Effect<Option.Option<A>, E, R> {
  return ref.updates((ref) => ref.delete);
}

export {
  /**
   * Deletes the current value of a `RefSubject`, resetting it to its initial state.
   *
   * @example
   * ```ts
   * import { Effect, Option } from "effect"
   * import * as RefSubject from "@typed/fx/RefSubject"
   *
   * const program = Effect.gen(function* () {
   *   const ref = yield* RefSubject.make(10)
   *   yield* RefSubject.set(ref, 20)
   *
   *   // Delete the current value
   *   const deleted = yield* RefSubject.delete(ref)
   *   console.log(Option.isSome(deleted)) // true
   *   console.log(deleted.value) // 20
   *
   *   // Value is reset to initial
   *   const current = yield* ref
   *   console.log(current) // 10
   * })
   * ```
   *
   * @since 1.20.0
   * @category State updates
   */
  reset as delete,
};

/**
 * Updates a `RefSubject` using an `Effect`ful function.
 *
 * @remarks
 * ## Why
 *
 * Updates a `RefSubject` using an `Effect`ful function. The transition is serialized at the
 * RefSubject rather than coordinated by callers or UI components.
 *
 * ## Ownership and lifetime
 *
 * Running update effect performs one serialized subject transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Update with an async operation
 *   yield* RefSubject.updateEffect(count, (value) =>
 *     Effect.succeed(value * 2)
 *   )
 *
 *   const result = yield* count
 *   console.log(result) // 10
 * })
 * ```
 *
 * @since 1.0.0
 * @category State updates
 */
export const updateEffect: {
  <A, E2, R2>(
    f: (value: A) => Effect.Effect<A, E2, R2>,
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(
    ref: RefSubject<A, E, R>,
    f: (value: A) => Effect.Effect<A, E2, R2>,
  ): Effect.Effect<A, E | E2, R | R2>;
} = dual(2, function updateEffect<
  A,
  E,
  R,
  E2,
  R2,
>(ref: RefSubject<A, E, R>, f: (value: A) => Effect.Effect<A, E2, R2>) {
  return ref.updates((ref) => Effect.flatMap(Effect.flatMap(ref.get, f), ref.set));
});

/**
 * Updates a `RefSubject` using a pure function.
 *
 * @remarks
 * ## Why
 *
 * `update` expresses a state transition where the state lives, without moving
 * transition logic into a component or renderer. The same function can run in
 * application code, tests, workers, event handlers, or a Typed template.
 *
 * ## Ownership and lifetime
 *
 * The update runs inside the RefSubject's existing synchronized update
 * boundary: it reads the committed value, derives the next value, commits it,
 * and publishes that change. It acquires no independent resource and retains
 * the subject's existing error and service channels.
 *
 * ## Concurrency and failure
 *
 * Concurrent updates are serialized by the subject core so each function sees
 * a committed value. A pure updater adds no error channel; failures already
 * associated with reading or writing the RefSubject remain explicit in `E`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Increment by 1
 *   yield* RefSubject.update(count, (n) => n + 1)
 *   const value = yield* count
 *   console.log(value) // 6
 *
 *   // Can also use pipe syntax
 *   yield* count.pipe(RefSubject.update((n) => n * 2))
 *   const doubled = yield* count
 *   console.log(doubled) // 12
 * })
 * ```
 *
 * @since 1.0.0
 * @category State updates
 */
export const update: {
  <A>(f: (value: A) => A): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E, R>;
  <A, E, R>(ref: RefSubject<A, E, R>, f: (value: A) => A): Effect.Effect<A, E, R>;
} = dual(2, function update<A, E, R>(ref: RefSubject<A, E, R>, f: (value: A) => A) {
  return updateEffect(ref, (value) => Effect.succeed(f(value)));
});

/**
 * Modifies a `RefSubject` using an `Effect`ful function that returns both a result and a new value.
 *
 * @remarks
 * ## Why
 *
 * Modifies a `RefSubject` using an `Effect`ful function that returns both a result and a new
 * value. The transition is serialized at the RefSubject rather than coordinated by callers or UI
 * components.
 *
 * ## Ownership and lifetime
 *
 * Running modify effect performs one serialized subject transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Get the old value and set a new one, returning the old value
 *   const oldValue = yield* RefSubject.modifyEffect(count, (value) =>
 *     Effect.succeed([value, value + 10] as const)
 *   )
 *
 *   console.log(oldValue) // 5
 *   const newValue = yield* count
 *   console.log(newValue) // 15
 * })
 * ```
 *
 * @since 1.0.0
 * @category Transactions
 */
export const modifyEffect: {
  <A, B, E2, R2>(
    f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>,
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<B, E | E2, R | R2>;
  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R>,
    f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>,
  ): Effect.Effect<B, E | E2, R | R2>;
} = dual(2, function modifyEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
>(ref: RefSubject<A, E, R>, f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>) {
  return ref.updates((ref) =>
    Effect.flatMap(ref.get, (value) =>
      Effect.flatMap(f(value), ([b, a]) => Effect.as(ref.set(a), b)),
    ),
  );
});

/**
 * Modifies a `RefSubject` using a pure function that returns both a result and a new value.
 *
 * @remarks
 * ## Why
 *
 * Modifies a `RefSubject` using a pure function that returns both a result and a new value. The
 * transition is serialized at the RefSubject rather than coordinated by callers or UI components.
 *
 * ## Ownership and lifetime
 *
 * Running modify performs one serialized subject transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Get the old value and increment, returning the old value
 *   const oldValue = yield* RefSubject.modify(count, (value) => [value, value + 1] as const)
 *
 *   console.log(oldValue) // 5
 *   const newValue = yield* count
 *   console.log(newValue) // 6
 * })
 * ```
 *
 * @since 1.0.0
 * @category Transactions
 */
export const modify: {
  <A, B>(
    f: (value: A) => readonly [B, A],
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<B, E, R>;
  <A, E, R, B>(ref: RefSubject<A, E, R>, f: (value: A) => readonly [B, A]): Effect.Effect<B, E, R>;
} = dual(2, function modify<
  A,
  E,
  R,
  B,
>(ref: RefSubject<A, E, R>, f: (value: A) => readonly [B, A]) {
  return modifyEffect(ref, (value) => Effect.succeed(f(value)));
});

/**
 * Checks if a value is a `RefSubject`.
 *
 * @remarks
 * ## Why
 *
 * Checks if a value is a `RefSubject`.
 *
 * ## Ownership and lifetime
 *
 * The derived ref owns no independent state or subscription. It follows the source lifetime and
 * routes writes through the source's synchronized update boundary.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const ref = yield* RefSubject.make(42)
 *   const isRef = RefSubject.isRefSubject(ref)
 *   console.log(isRef) // true
 *
 *   const notRef = { value: 42 }
 *   const isNotRef = RefSubject.isRefSubject(notRef)
 *   console.log(isNotRef) // false
 * })
 * ```
 *
 * @since 1.0.0
 * @category Type guards
 */
export function isRefSubject(value: any): value is RefSubject<any, any, any> {
  return hasProperty(value, RefSubjectTypeId) && value[RefSubjectTypeId] === RefSubjectTypeId;
}

const isRefSubjectDataFirst = (args: IArguments) => isRefSubject(args[0]);

/**
 * Tests whether a value carries the public Computed TypeId.
 *
 * @remarks
 * ## Why
 *
 * Uses the TypeId contract rather than a concrete implementation class, so custom Computed values
 * and service facades participate in the same runtime guard.
 *
 * ## Ownership and lifetime
 *
 * This synchronous predicate performs no Effect, subscription, or acquisition.
 *
 * @since 1.18.0
 * @category Type guards
 */
export function isComputed(value: any): value is Computed<any, any, any> {
  return hasProperty(value, ComputedTypeId) && value[ComputedTypeId] === ComputedTypeId;
}

/**
 * Runs an effect that can modify a `RefSubject` transactionally, with optional interrupt handling.
 *
 * @remarks
 * ## Why
 *
 * Runs an effect that can modify a `RefSubject` transactionally, with optional interrupt handling.
 * The transition is serialized at the RefSubject rather than coordinated by callers or UI
 * components.
 *
 * ## Ownership and lifetime
 *
 * Running run updates performs one serialized subject transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* RefSubject.make(100)
 *
 *   // Transfer money atomically with interrupt handling
 *   yield* RefSubject.runUpdates(
 *     balance,
 *     (ref) =>
 *       Effect.gen(function* () {
 *         const current = yield* ref.get
 *         if (current >= 50) {
 *           yield* ref.set(current - 50)
 *           return "Transfer successful"
 *         }
 *         return "Insufficient funds"
 *       }),
 *     {
 *       onInterrupt: (value) => Effect.sync(() => console.log(`Interrupted at balance: ${value}`)),
 *       value: "initial"
 *     }
 *   )
 * })
 * ```
 *
 * @since 1.0.0
 * @category Transactions
 */
export const runUpdates: {
  <A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?: {
      readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>;
      readonly value?: "initial" | "current";
    },
  ): (ref: RefSubject<A, E, R>) => Effect.Effect<B, E | E2 | E3, R | R2 | R3>;

  <A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    ref: RefSubject<A, E, R>,
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?: {
      readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>;
      readonly value?: "initial" | "current";
    },
  ): Effect.Effect<B, E | E2 | E3, R | R2 | R3>;
} = dual(
  isRefSubjectDataFirst,
  function runUpdates<A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    ref: RefSubject<A, E, R>,
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?: {
      readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>;
      readonly value?: "initial" | "current";
    },
  ) {
    if (options === undefined) {
      return ref.updates(f);
    } else if (options.value === "initial") {
      return ref.updates((ref) =>
        Effect.flatMap(ref.get, (initial) =>
          f(ref).pipe(Effect.onInterrupt(() => options.onInterrupt(initial))),
        ),
      );
    } else {
      return ref.updates((ref) =>
        f(ref).pipe(Effect.onInterrupt(() => Effect.flatMap(ref.get, options.onInterrupt))),
      );
    }
  },
);

/**
 * Increments a numeric `RefSubject` by 1.
 *
 * @remarks
 * ## Why
 *
 * Increments a numeric `RefSubject` by 1. The transition is serialized at the RefSubject rather
 * than coordinated by callers or UI components.
 *
 * ## Ownership and lifetime
 *
 * Running increment performs one serialized subject transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   yield* RefSubject.increment(count)
 *   const value = yield* count
 *   console.log(value) // 1
 *
 *   yield* RefSubject.increment(count)
 *   const newValue = yield* count
 *   console.log(newValue) // 2
 * })
 * ```
 *
 * @since 1.0.0
 * @category State updates
 */
export function increment<E, R>(ref: RefSubject<number, E, R>): Effect.Effect<number, E, R> {
  return update(ref, (value) => value + 1);
}

/**
 * Decrements a numeric `RefSubject` by 1.
 *
 * @remarks
 * ## Why
 *
 * Decrements a numeric `RefSubject` by 1. The transition is serialized at the RefSubject rather
 * than coordinated by callers or UI components.
 *
 * ## Ownership and lifetime
 *
 * Running decrement performs one serialized subject transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(10)
 *
 *   yield* RefSubject.decrement(count)
 *   const value = yield* count
 *   console.log(value) // 9
 *
 *   yield* RefSubject.decrement(count)
 *   const newValue = yield* count
 *   console.log(newValue) // 8
 * })
 * ```
 *
 * @since 1.0.0
 * @category State updates
 */
export function decrement<E, R>(ref: RefSubject<number, E, R>): Effect.Effect<number, E, R> {
  return update(ref, (value) => value - 1);
}

const Variance: Fx.Variance<any, any, any> = {
  _A: identity,
  _E: identity,
  _R: identity,
};

/**
 * Creates a Context-backed RefSubject service facade and Layer constructors.
 *
 * @remarks
 * ## Why
 *
 * The returned class is simultaneously a service tag, a current-value Effect, an Fx source, and a
 * writable RefSubject facade. This lets consumers read, observe, and update renderer-independent
 * state without manually retrieving the underlying service from Context.
 *
 * ## Ownership and lifetime
 *
 * Calling `Service` is pure. `layer` installs an existing scoped RefSubject; `make` constructs one
 * and installs it in a Layer. The Layer Scope owns the subject and its initializer subscription.
 * Reads and pushes expose the declared `E` channel; construction requirements remain on the Layer,
 * while consumers require only the generated `Self` service.
 *
 * @since 1.18.0
 * @category Services
 */
export function Service<Self, A, E = never>() {
  return <const Id extends string>(id: Id): RefSubject.Class<Self, Id, A, E> => {
    const service = Context.Service<Self, RefSubject<A, E>>(id);

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    return class RefSubjectService {
      /// Service

      static {
        // @effect-diagnostics-next-line floatingEffect:off
        Object.assign(this, service);
        Object.setPrototypeOf(this, Object.getPrototypeOf(service));
        // @effect-diagnostics-next-line floatingEffect:off
        Object.assign(this, Effectable.Prototype<Effect.Effect<A, E, Self>>({
          label: "RefSubject.Service",
          evaluate: () => Effect.flatMap(service, identity),
        }));
      }

      static readonly id = id;
      static readonly service = service;

      static readonly layer = <E2, R2>(
        make: Effect.Effect<RefSubject<A, E>, E2, R2 | Scope.Scope>,
      ) => Layer.effect(service, make);

      static readonly make = <R = never>(
        value: A | Effect.Effect<A, E, R> | Fx<A, E, R>,
        options?: RefSubjectOptions<A> & Partial<Bounds>,
      ): Layer.Layer<Self, never, R> => {
        const bounds = getDefaultBounds(options);
        return make(value, options).pipe(
          Effect.map((ref) => (bounds ? slice(ref, bounds.skip, bounds.take) : ref)),
          this.layer,
        );
      };

      // Fx
      static readonly [FxTypeId]: Fx.Variance<A, E, Self> = Variance;
      static readonly run = <RSink>(sink: Sink.Sink<A, E, RSink>) =>
        Effect.flatMap(service, (ref) => ref.run(sink));

      // Sink
      static readonly onSuccess = (value: A) =>
        Effect.flatMap(service, (ref) => ref.onSuccess(value));
      static readonly onFailure = (cause: Cause.Cause<E>) =>
        Effect.flatMap(service, (ref) => ref.onFailure(cause));

      /// Computed
      static readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
      static readonly version = Effect.flatMap(service, (ref) => ref.version);

      // Subject
      static readonly subscriberCount = Effect.flatMap(service, (ref) => ref.subscriberCount);
      static readonly interrupt = Effect.flatMap(service, (ref) => ref.interrupt);

      // RefSubject
      static readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;
      static readonly updates = <B, E2, R2>(
        f: (ref: GetSetDelete<A, E, never>) => Effect.Effect<B, E2, R2>,
      ) => Effect.flatMap(service, (ref) => ref.updates(f));

      // Yieldable
      static readonly override = Effect.flatten(service);
      static readonly [Symbol.iterator] = function* () {
        const ref = yield* service;
        return yield* ref;
      };
      static readonly pipe: RefSubject.Service<Self, Id, A, E>["pipe"] = function pipe(
        this: RefSubject.Service<Self, Id, A, E>,
      ) {
        return pipeArguments(this, arguments);
      };

      constructor() {
        return RefSubjectService;
      }
    } as unknown as RefSubject.Class<Self, Id, A, E>;
  };
}

function getDefaultBounds(options?: Partial<Bounds>): Bounds | undefined {
  if (options === undefined || (options.skip === undefined && options.take === undefined)) {
    return { skip: 0, take: Infinity };
  }

  return { skip: options.skip ?? 0, take: options.take ?? Infinity };
}

/**
 * Extract all values from an object using a Proxy.
 * Allows accessing nested properties of a `Computed` or `Filtered` object/array as individual computed values.
 *
 * @remarks
 * ## Why
 *
 * Lazily creates one property projection per accessed key and memoizes that projection on the
 * JavaScript Proxy. A Computed or RefSubject source produces Computed properties; only a Filtered
 * source produces Filtered properties and preserves conditional absence.
 *
 * ## Ownership and lifetime
 *
 * The Proxy caches derived view objects, not property values. Computed property reads expose only
 * the source's `E`; Filtered property reads can additionally fail with `NoSuchElementError` while
 * their source is absent. Each observed property follows the source and uses the observing Scope.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const user = yield* RefSubject.make({ name: "Alice", age: 30 })
 *
 *   // Create a proxy to access nested properties
 *   const proxied = RefSubject.proxy(user)
 *
 *   // Access individual properties as Computed values
 *   const name = yield* proxied.name
 *   console.log(name) // "Alice"
 *
 *   const age = yield* proxied.age
 *   console.log(age) // 30
 *
 *   // Update the source
 *   yield* RefSubject.set(user, { name: "Bob", age: 25 })
 *
 *   // Proxied values automatically update
 *   const newName = yield* proxied.name
 *   console.log(newName) // "Bob"
 * })
 * ```
 *
 * @since 2.0.0
 * @category Derived queries
 */
export const proxy: {
  <A extends ReadonlyArray<any> | Readonly<Record<PropertyKey, any>>, E, R>(
    source: Computed<A, E, R>,
  ): { readonly [K in keyof A]: Computed<A[K], E, R> };

  <A extends ReadonlyArray<any> | Readonly<Record<PropertyKey, any>>, E, R>(
    source: Filtered<A, E, R>,
  ): { readonly [K in keyof A]: Filtered<A[K], E, R> };
} = <A extends Readonly<Record<PropertyKey, any>> | ReadonlyArray<any>, E, R>(
  source: Computed<A, E, R> | Filtered<A, E, R>,
): any => {
  const target: any = {};
  return new Proxy(target, {
    get(self, prop) {
      if (prop in self) return self[prop];
      return (self[prop] = map(source, (a) => a[prop as keyof A]));
    },
  });
};

/**
 * Describes the services type.
 *
 * @remarks
 * ## Why
 *
 * Extracts the service requirement channel from a RefSubject, Computed, or Filtered value.
 *
 * ## Ownership and lifetime
 *
 * Services is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type Services<T> =
  T extends RefSubject<infer _A, infer _E, infer R>
    ? R
    : T extends Computed<infer _A, infer _E, infer R>
      ? R
      : T extends Filtered<infer _A, infer _E, infer R>
        ? R
        : never;

/**
 * Describes the error type.
 *
 * @remarks
 * ## Why
 *
 * Extracts the declared state error channel from a RefSubject, Computed, or Filtered value.
 *
 * ## Ownership and lifetime
 *
 * Error is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type Error<T> =
  T extends RefSubject<infer _A, infer E, infer _R>
    ? E
    : T extends Computed<infer _A, infer E, infer _R>
      ? E
      : T extends Filtered<infer _A, infer E, infer _R>
        ? E
        : never;

/**
 * Describes the success type.
 *
 * @remarks
 * ## Why
 *
 * Extracts the current/read value type from a RefSubject, Computed, or Filtered value.
 *
 * ## Ownership and lifetime
 *
 * Success is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type Success<T> =
  T extends RefSubject<infer A, infer _E, infer _R>
    ? A
    : T extends Computed<infer A, infer _E, infer _R>
      ? A
      : T extends Filtered<infer A, infer _E, infer _R>
        ? A
        : never;

/**
 * Describes the identifier type.
 *
 * @remarks
 * ## Why
 *
 * Extracts the Context service identifier type represented by a RefSubject service facade.
 *
 * ## Ownership and lifetime
 *
 * Identifier is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category Type utilities
 */
export type Identifier<T> =
  T extends RefSubject.Service<infer R, infer _Id, infer _A, infer _E> ? R : never;

/**
 * Transforms a `RefSubject`, `Computed`, or `Filtered` using an `Effect`ful function.
 *
 * @remarks
 * ## Why
 *
 * Applies one Effectful derivation to current reads and pushed versions. RefSubject and Computed
 * inputs return Computed and add only `E2`; a Filtered input returns Filtered and preserves its
 * conditional absence in addition to `E2`.
 *
 * ## Ownership and lifetime
 *
 * No callback runs until the result is read or observed. Computed results cannot become absent and
 * do not add `NoSuchElementError`; only the Filtered overload can fail a current read for absence.
 * Callback services and failures remain `R2` and `E2`, and the observing Scope owns subscription
 * cleanup.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Transform with an async operation
 *   const doubled = RefSubject.mapEffect(count, (n) =>
 *     Effect.succeed(n * 2)
 *   )
 *
 *   const value = yield* doubled
 *   console.log(value) // 10
 *
 *   // Update source
 *   yield* RefSubject.set(count, 7)
 *
 *   // Computed automatically updates
 *   const newValue = yield* doubled
 *   console.log(newValue) // 14
 * })
 * ```
 *
 * @since 1.0.0
 * @category Derived queries
 */
export const mapEffect: {
  <T extends RefSubject.Any | Computed.Any | Filtered.Any, B, E2, R2>(
    f: (a: Success<T>) => Effect.Effect<B, E2, R2>,
  ): (
    ref: T,
  ) => T extends Filtered.Any
    ? Filtered<B, Error<T> | E2, Services<T> | R2>
    : Computed<B, Error<T> | E2, Services<T> | R2>;

  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Computed<B, E | E2, R | R2>;

  <A, E, R, B, E2, R2>(
    ref: Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Filtered<B, E | E2, R | R2>;

  <R0, E0, A, E, R, E2, R2, C, E3, R3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<C, E3, R3>,
  ): Computed<C, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>;
} = dual(2, function mapEffect<
  R0,
  E0,
  A,
  E,
  R,
  E2,
  R2,
  C,
  E3,
  R3,
>(versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>, f: (a: A) => Effect.Effect<C, E3, R3>):
  | Computed<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3>
  | Filtered<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3> {
  return FilteredTypeId in versioned
    ? new FilteredImpl(versioned, (a) => Effect.asSome(f(a)))
    : new ComputedImpl(versioned, f);
});

/**
 * Transforms a `RefSubject`, `Computed`, or `Filtered` using a pure function.
 *
 * @remarks
 * ## Why
 *
 * `map` creates derived state instead of copying source state into a component.
 * Reads and pushed updates remain connected to the original `Versioned` value,
 * so a projection can be tested without rendering and consumed by any renderer.
 *
 * ## Ownership and lifetime
 *
 * The returned `Computed` or `Filtered` view does not take ownership of the
 * source. It follows the source lifetime and preserves its error and service
 * channels. The pure mapping function adds neither resources nor failures.
 *
 * ## Re-computation
 *
 * The mapping function runs for the current value and subsequent committed
 * source versions. Updates still occur on the writable source; the derived view
 * is read-only unless a more specific bidirectional combinator is used.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Create a computed that doubles the count
 *   const doubled = RefSubject.map(count, (n) => n * 2)
 *
 *   const value = yield* doubled
 *   console.log(value) // 10
 *
 *   // Update source
 *   yield* RefSubject.set(count, 7)
 *
 *   // Computed automatically updates
 *   const newValue = yield* doubled
 *   console.log(newValue) // 14
 * })
 * ```
 *
 * @since 1.0.0
 * @category Derived queries
 */
export const map: {
  <T extends RefSubject.Any | Computed.Any | Filtered.Any, B>(
    f: (a: Success<T>) => B,
  ): (
    ref: T,
  ) => T extends Filtered.Any
    ? Filtered<B, Error<T>, Services<T>>
    : Computed<B, Error<T>, Services<T>>;

  <A, E, R, B>(ref: RefSubject<A, E, R> | Computed<A, E, R>, f: (a: A) => B): Computed<B, E, R>;
  <A, E, R, B>(filtered: Filtered<A, E, R>, f: (a: A) => B): Filtered<B, E, R>;

  <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => B,
  ):
    | Computed<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>
    | Filtered<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>;
} = dual(2, function map<
  R0,
  E0,
  A,
  E,
  R,
  B,
  E2,
  R2,
>(versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>, f: (a: A) => B):
  | Computed<B, E0 | E | E2, R0 | Exclude<R, Scope.Scope> | R2>
  | Filtered<B, E0 | E | E2, R0 | Exclude<R, Scope.Scope> | R2> {
  return mapEffect(versioned, (a) => Effect.succeed(f(a)));
});

/**
 * Filters and transforms a `RefSubject`, `Computed`, or `Filtered` using an `Effect`ful function that returns an `Option`.
 *
 * @remarks
 * ## Why
 *
 * Filters and transforms a `RefSubject`, `Computed`, or `Filtered` using an `Effect`ful function
 * that returns an `Option`. Current reads and pushed versions use the same derivation, preventing
 * snapshot and subscription behavior from diverging.
 *
 * ## Ownership and lifetime
 *
 * The filter map effect view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const numbers = yield* RefSubject.make([1, 2, 3, 4, 5])
 *
 *   // Find the first even number
 *   const firstEven = RefSubject.filterMapEffect(numbers, (arr) =>
 *     Effect.succeed(Option.fromNullable(arr.find((n) => n % 2 === 0)))
 *   )
 *
 *   const value = yield* firstEven
 *   console.log(value) // 2
 * })
 * ```
 *
 * @since 1.0.0
 * @category Optional queries
 */
export const filterMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
  ): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Filtered<B, E | E2, R | R2>;
    <E, R>(ref: Filtered<A, E, R>): Filtered<B, E | E2, R | R2>;
    <R0, E0, B, E, R, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
    ): Filtered<B, E0 | E | E2, R0 | R2>;
  };

  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
  ): Filtered<B, E | E2, R | R2>;
  <R0, E0, A, E, R, B, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E3, R3>,
  ): Filtered<B, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>;
} = dual(2, function filterMapEffect<
  R0,
  E0,
  A,
  E,
  R,
  B,
  E2,
  R2,
  R3,
  E3,
>(versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>, f: (a: A) => Effect.Effect<Option.Option<B>, E3, R3>): Filtered<
  B,
  E0 | E | E2 | E3,
  R0 | Exclude<R, Scope.Scope> | R2 | R3
> {
  return new FilteredImpl(versioned, f);
});

/**
 * Filters and transforms a `RefSubject`, `Computed`, or `Filtered` using a pure function that returns an `Option`.
 *
 * @remarks
 * ## Why
 *
 * Filters and transforms a `RefSubject`, `Computed`, or `Filtered` using a pure function that
 * returns an `Option`. Current reads and pushed versions use the same derivation, preventing
 * snapshot and subscription behavior from diverging.
 *
 * ## Ownership and lifetime
 *
 * The filter map view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const numbers = yield* RefSubject.make([1, 2, 3, 4, 5])
 *
 *   // Get the first even number
 *   const firstEven = RefSubject.filterMap(numbers, (arr) =>
 *     Option.fromNullable(arr.find((n) => n % 2 === 0))
 *   )
 *
 *   const value = yield* firstEven
 *   console.log(value) // 2
 * })
 * ```
 *
 * @since 1.0.0
 * @category Optional queries
 */
export const filterMap: {
  <A, B>(
    f: (a: A) => Option.Option<B>,
  ): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>): Filtered<B, E, R>;
    <R0, E0, B, E, R, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Option.Option<B>,
    ): Filtered<B, E0 | E | E2, R0 | R2>;
  };

  <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Option.Option<B>,
  ): Filtered<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>;

  <A, E, R, B>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Option.Option<B>,
  ): Filtered<B, E, R>;
} = dual(2, function filterMap<
  R0,
  E0,
  A,
  E,
  R,
  B,
  E2,
  R2,
>(versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>, f: (a: A) => Option.Option<B>): Filtered<
  B,
  E0 | E | E2,
  R0 | Exclude<R, Scope.Scope> | R2
> {
  return new FilteredImpl(versioned, (a) => Effect.succeed(f(a)));
});

/**
 * Converts a `Computed` or `Filtered` of `Option<A>` into a `Filtered<A>`, filtering out `None` values.
 *
 * @remarks
 * ## Why
 *
 * Converts a `Computed` or `Filtered` of `Option<A>` into a `Filtered<A>`, filtering out `None`
 * values. Current reads and pushed versions use the same derivation, preventing snapshot and
 * subscription behavior from diverging.
 *
 * ## Ownership and lifetime
 *
 * The compact view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const maybeValue = yield* RefSubject.make(Option.some(42))
 *
 *   // Compact the Option
 *   const filtered = RefSubject.compact(maybeValue)
 *
 *   const value = yield* filtered
 *   console.log(value) // 42
 *
 *   // If the Option becomes None, the Filtered will fail
 *   yield* RefSubject.set(maybeValue, Option.none())
 *   // yield* filtered would fail with NoSuchElementError
 * })
 * ```
 *
 * @since 1.0.0
 * @category Optional queries
 */
export const compact: {
  <A, E, R>(ref: Computed<Option.Option<A>, E, R>): Filtered<A, E, R>;
  <A, E, R>(ref: Filtered<Option.Option<A>, E, R>): Filtered<A, E, R>;

  <R0, E0, A, E, R, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, Option.Option<A>, E, R, Option.Option<A>, E2, R2>,
  ): Filtered<
    A,
    E0 | E | Exclude<E, Cause.NoSuchElementError> | Exclude<E2, Cause.NoSuchElementError>,
    R0 | R2 | Exclude<R, Scope.Scope>
  >;
} = function compact<R0, E0, A, E, R, E2, R2>(
  versioned: Versioned.Versioned<R0, E0, Option.Option<A>, E, R, Option.Option<A>, E2, R2>,
): any {
  return new FilteredImpl(versioned, Effect.succeed);
};

/**
 * Returns a `Computed` that yields the value inside the `Option`, or the fallback when `None`.
 * Works with `Computed<Option<A>>` (e.g. from `fromOption` / `fromNullable`) and with `Filtered<A>`.
 *
 * @remarks
 * ## Why
 *
 * Returns a `Computed` that yields the value inside the `Option`, or the fallback when `None`.
 * Works with `Computed<Option<A>>` (e.g. from `fromOption` / `fromNullable`) and with
 * `Filtered<A>`. Current reads and pushed versions use the same derivation, preventing snapshot
 * and subscription behavior from diverging.
 *
 * ## Ownership and lifetime
 *
 * The returned Computed never fails for absence: `None` or an absent Filtered value invokes
 * `fallback`. It preserves only the input's declared `E` and `R`; the pure fallback adds no failure,
 * service, subscription, or retained value.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const ref = yield* RefSubject.fromOption(Option.some(42))
 *   const withDefault = RefSubject.getOrElse(ref, () => 0)
 *   expect(yield* withDefault).toBe(42)
 *
 *   const empty = yield* RefSubject.fromNullable(null)
 *   const fallback = RefSubject.getOrElse(empty, () => 99)
 *   expect(yield* fallback).toBe(99)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Optional queries
 */
export const getOrElse: {
  <A>(
    fallback: () => A,
  ): <E, R>(ref: Computed<Option.Option<A>, E, R> | Filtered<A, E, R>) => Computed<A, E, R>;
  <A, E, R>(
    ref: Computed<Option.Option<A>, E, R> | Filtered<A, E, R>,
    fallback: () => A,
  ): Computed<A, E, R>;
} = dual(2, function getOrElse<
  A,
  E,
  R,
>(ref: Computed<Option.Option<A>, E, R> | Filtered<A, E, R>, fallback: () => A): Computed<A, E, R> {
  const computed = FilteredTypeId in ref ? (ref as Filtered<A, E, R>).asComputed() : ref;
  return map(computed, (opt) => Option.getOrElse(opt, fallback));
});

class RefSubjectSimpleTransform<A, E, R, R2, R3>
  extends YieldableFx<A, E, R | R2 | Scope.Scope, A, E, R | R3>
  implements RefSubject<A, E, R | R2 | R3>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  readonly version: Effect.Effect<number, E, R>;
  readonly interrupt: Effect.Effect<void, never, R>;
  readonly subscriberCount: Effect.Effect<number, never, R>;
  private _fx: Fx<A, E, Scope.Scope | R | R2>;

  readonly ref: RefSubject<A, E, R>;
  readonly transformFx: (fx: Fx<A, E, Scope.Scope | R>) => Fx<A, E, Scope.Scope | R | R2>;
  readonly transformEffect: (effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | R3>;

  constructor(
    ref: RefSubject<A, E, R>,
    transformFx: (fx: Fx<A, E, Scope.Scope | R>) => Fx<A, E, Scope.Scope | R | R2>,
    transformEffect: (effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | R3>,
  ) {
    super();

    this.ref = ref;
    this.transformFx = transformFx;
    this.transformEffect = transformEffect;
    this.version = ref.version;
    this.interrupt = ref.interrupt;
    this.subscriberCount = ref.subscriberCount;

    this._fx = transformFx(ref);
  }

  run<R4>(sink: Sink.Sink<A, E, R4>) {
    return this._fx.run(sink);
  }

  toEffect(): Effect.Effect<A, E, R | R3> {
    return this.transformEffect(this.ref);
  }

  updates<E2, R2, C>(
    run: (ref: GetSetDelete<A, E, R>) => Effect.Effect<C, E2, R2>,
  ): Effect.Effect<C, E | E2, R | R2> {
    return this.ref.updates(run);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.ref.onFailure(cause);
  }

  onSuccess(value: A): Effect.Effect<unknown, never, R> {
    return this.ref.onSuccess(value);
  }
}

/**
 * Limits which pushed versions a RefSubject view observes without changing its state.
 *
 * @remarks
 * ## Why
 *
 * Applies `skip` and `take` only to the Fx observation channel. Current reads still sample the
 * underlying RefSubject directly, and writes still use its original serialized update boundary.
 *
 * ## Ownership and lifetime
 *
 * Creating the view starts nothing and retains no value. Each observation uses its Scope and ends
 * after `take` selected pushes; ending that observation does not interrupt or delete the source.
 * Version, interruption, subscriber count, reads, failures, services, and writes delegate to the
 * source RefSubject.
 *
 * @since 1.18.0
 * @category Observation policy
 */
export const slice: {
  (skip: number, take: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>;
  <A, E, R>(ref: RefSubject<A, E, R>, skip: number, take: number): RefSubject<A, E, R>;
} = dual(3, function slice<
  A,
  E,
  R,
>(ref: RefSubject<A, E, R>, skip: number, take: number): RefSubject<A, E, R> {
  return new RefSubjectSimpleTransform(ref, (_) => fxSlice(_, { skip, take }), identity);
});

class RefSubjectTransform<A, B, E, R>
  extends YieldableFx<B, E, R | Scope.Scope, B, E, R>
  implements RefSubject<B, E, R>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  readonly version: Effect.Effect<number, E, R>;
  readonly interrupt: Effect.Effect<void, never, R>;
  readonly subscriberCount: Effect.Effect<number, never, R>;
  private _fx: Fx<B, E, Scope.Scope | R>;

  readonly ref: RefSubject<A, E, R>;
  readonly toB: (a: A) => B;
  readonly toA: (b: B) => A;

  constructor(ref: RefSubject<A, E, R>, toB: (a: A) => B, toA: (b: B) => A) {
    super();

    this.ref = ref;
    this.toB = toB;
    this.toA = toA;
    this.version = ref.version;
    this.interrupt = ref.interrupt;
    this.subscriberCount = ref.subscriberCount;

    this._fx = fxMapEffect(ref, (a) => Effect.succeed(toB(a)));
  }

  run<R2>(sink: Sink.Sink<B, E, R2>) {
    return this._fx.run(sink);
  }

  toEffect(): Effect.Effect<B, E, R> {
    return Effect.map(this.ref, this.toB);
  }

  updates<E2, R2, C>(
    run: (ref: GetSetDelete<B, E, R>) => Effect.Effect<C, E2, R2>,
  ): Effect.Effect<C, E | E2, R | R2> {
    return this.ref.updates((innerRef) => {
      const getSetDelete: GetSetDelete<B, E, R> = {
        get: Effect.map(innerRef.get, this.toB),
        set: (b: B) => Effect.map(innerRef.set(this.toA(b)), this.toB),
        delete: Effect.map(innerRef.delete, Option.map(this.toB)),
      };
      return run(getSetDelete);
    });
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.ref.onFailure(cause);
  }

  onSuccess(value: B): Effect.Effect<unknown, never, R> {
    return this.ref.onSuccess(this.toA(value));
  }
}

/**
 * Transforms a `RefSubject` invariantly using bidirectional mapping functions.
 *
 * @remarks
 * ## Why
 *
 * Creates a bidirectional lens over state: reads map outward and writes map back to the original
 * RefSubject without allocating a second store.
 *
 * ## Ownership and lifetime
 *
 * The derived ref owns no independent state or subscription. It follows the source lifetime and
 * routes writes through the source's synchronized update boundary.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(5)
 *
 *   // Transform to string and back
 *   const countStr = RefSubject.transform(
 *     count,
 *     (n) => n.toString(),
 *     (s) => parseInt(s, 10)
 *   )
 *
 *   const value = yield* countStr
 *   console.log(value) // "5"
 *
 *   // Set using the transformed type
 *   yield* RefSubject.set(countStr, "10")
 *
 *   // Original reflects the change
 *   const original = yield* count
 *   console.log(original) // 10
 * })
 * ```
 *
 * @since 1.0.0
 * @category Writable views
 */
export const transform: {
  <A, B>(
    toB: (a: A) => B,
    toA: (b: B) => A,
  ): <E, R>(ref: RefSubject<A, E, R>) => RefSubject<B, E, R>;
  <A, E, R, B>(ref: RefSubject<A, E, R>, toB: (a: A) => B, toA: (b: B) => A): RefSubject<B, E, R>;
} = dual(3, function transform<
  A,
  E,
  R,
  B,
>(ref: RefSubject<A, E, R>, toB: (a: A) => B, toA: (b: B) => A): RefSubject<B, E, R> {
  return new RefSubjectTransform(ref, toB, toA);
});

type RefKind = "r" | "c" | "f";

const join = (a: RefKind, b: RefKind) => {
  if (a === "r") return b;
  if (b === "r") return a;
  if (a === "f") return a;
  if (b === "f") return b;
  return "c";
};

function getRefKind<
  const Refs extends ReadonlyArray<
    RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>
  >,
>(refs: Refs): RefKind {
  let kind: RefKind = "r";

  for (const ref of refs) {
    if (FilteredTypeId in ref) {
      kind = "f";
      break;
    } else if (!(RefSubjectTypeId in ref)) {
      kind = join(kind, "c");
    }
  }

  return kind;
}

type StructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>,
> = [keyof Refs] extends [never]
  ? RefSubject<{ readonly [K in keyof Refs]: never }, never, never>
  : {
      c: [ComputedStructFrom<Refs>] extends [Computed<infer A, infer E, infer R>]
        ? Computed<A, E, R>
        : never;
      f: [FilteredStructFrom<Refs>] extends [Filtered<infer A, infer E, infer R>]
        ? Filtered<A, E, R>
        : never;
      r: [RefSubjectStructFrom<Refs>] extends [RefSubject<infer A, infer E, infer R>]
        ? RefSubject<A, E, R>
        : never;
    }[GetStructKind<Refs>];

type GetStructKind<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>,
> = MergeKinds<
  UnionToTuple<
    {
      [K in keyof Refs]: MatchKind<Refs[K]>;
    }[keyof Refs]
  >
>;

type Ref = RefSubject.Any | Computed.Any | Filtered.Any;

type MatchKind<T extends Ref> = [T] extends [Filtered.Any]
  ? "f"
  : [T] extends [RefSubject.Any]
    ? "r"
    : "c";

type MergeKind<A extends RefKind, B extends RefKind> = A extends "f"
  ? A
  : B extends "f"
    ? B
    : A extends "r"
      ? B
      : B extends "r"
        ? A
        : "c";

type MergeKinds<Kinds extends ReadonlyArray<any>> = Kinds extends readonly [
  infer Head extends RefKind,
  ...infer Tail extends ReadonlyArray<RefKind>,
]
  ? MergeKind<Head, MergeKinds<Tail>>
  : "r";

type FilteredStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>,
> = Filtered<
  {
    readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
  },
  FxError<Refs[keyof Refs]>,
  Effect.Services<Refs[keyof Refs]>
>;

type ComputedStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>,
> = Computed<
  {
    readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
  },
  Effect.Error<Refs[keyof Refs]>,
  Effect.Services<Refs[keyof Refs]>
>;

type RefSubjectStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>,
> = RefSubject<
  {
    readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
  },
  Effect.Error<Refs[keyof Refs]>,
  Effect.Services<Refs[keyof Refs]>
>;

type TupleFrom<
  Refs extends ReadonlyArray<
    RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>
  >,
> = Refs extends readonly []
  ? RefSubject<readonly [], never, never>
  : {
      c: [ComputedTupleFrom<Refs>] extends [Computed<infer A, infer E, infer R>]
        ? Computed<A, E, R>
        : never;
      f: [FilteredTupleFrom<Refs>] extends [Filtered<infer A, infer E, infer R>]
        ? Filtered<A, E, R>
        : never;
      r: [RefSubjectTupleFrom<Refs>] extends [RefSubject<infer A, infer E, infer R>]
        ? RefSubject<A, E, R>
        : never;
    }[GetTupleKind<Refs>];

type GetTupleKind<
  Refs extends ReadonlyArray<Ref>,
  Kind extends RefKind = "r",
> = Refs extends readonly [infer Head extends Ref, ...infer Tail extends ReadonlyArray<Ref>]
  ? GetTupleKind<Tail, MergeKind<Kind, MatchKind<Head>>>
  : Kind;

type FilteredTupleFrom<
  Refs extends ReadonlyArray<
    RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>
  >,
> = Filtered<
  {
    readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
  },
  FxError<Refs[number]>,
  Effect.Services<Refs[number]>
>;

type ComputedTupleFrom<
  Refs extends ReadonlyArray<
    RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>
  >,
> = Computed<
  {
    readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
  },
  Effect.Error<Refs[number]>,
  Effect.Services<Refs[number]>
>;

type RefSubjectTupleFrom<
  Refs extends ReadonlyArray<
    RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>
  >,
> = RefSubject<
  {
    readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
  },
  Effect.Error<Refs[number]>,
  Effect.Services<Refs[number]>
>;

/**
 * Combines multiple `RefSubject`, `Computed`, or `Filtered` instances into a single struct.
 *
 * @remarks
 * ## Why
 *
 * Combines several refs into one state value while preserving whether the result is writable,
 * computed, or filtered from its inputs.
 *
 * ## Ownership and lifetime
 *
 * This declaration performs no acquisition and retains no resources. Implementations preserve
 * source errors, services, and lifetime.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const firstName = yield* RefSubject.make("Alice")
 *   const lastName = yield* RefSubject.make("Smith")
 *   const age = yield* RefSubject.make(30)
 *
 *   // Combine into a struct
 *   const person = RefSubject.struct({
 *     firstName,
 *     lastName,
 *     age
 *   })
 *
 *   const fullPerson = yield* person
 *   console.log(fullPerson) // { firstName: "Alice", lastName: "Smith", age: 30 }
 *
 *   // Update one field
 *   yield* RefSubject.set(firstName, "Bob")
 *
 *   // Struct automatically updates
 *   const updated = yield* person
 *   console.log(updated.firstName) // "Bob"
 * })
 * ```
 *
 * @since 1.0.0
 * @category State composition
 */
export function struct<
  const Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>,
>(refs: Refs): StructFrom<Refs> {
  const kind = getRefKind(Object.values(refs));
  switch (kind) {
    case "r":
      return makeStructRef(refs as any) as StructFrom<Refs>;
    case "c":
      return makeStructComputed(refs as any) as StructFrom<Refs>;
    case "f":
      return makeStructFiltered(refs as any) as any as StructFrom<Refs>;
  }
}
/**
 * Combines multiple `RefSubject`, `Computed`, or `Filtered` instances into a single tuple.
 *
 * @remarks
 * ## Why
 *
 * Combines several refs into one state value while preserving whether the result is writable,
 * computed, or filtered from its inputs.
 *
 * ## Ownership and lifetime
 *
 * This declaration performs no acquisition and retains no resources. Implementations preserve
 * source errors, services, and lifetime.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const x = yield* RefSubject.make(10)
 *   const y = yield* RefSubject.make(20)
 *   const z = yield* RefSubject.make(30)
 *
 *   // Combine into a tuple
 *   const point = RefSubject.tuple([x, y, z])
 *
 *   const coords = yield* point
 *   console.log(coords) // [10, 20, 30]
 *
 *   // Update one value
 *   yield* RefSubject.set(x, 15)
 *
 *   // Tuple automatically updates
 *   const updated = yield* point
 *   console.log(updated) // [15, 20, 30]
 * })
 * ```
 *
 * @since 1.0.0
 * @category State composition
 */
export function tuple<const Refs extends ReadonlyArray<Ref>>(refs: Refs): TupleFrom<Refs> {
  const kind = getRefKind(refs);
  switch (kind) {
    case "r":
      return makeTupleRef(refs as any) as TupleFrom<Refs>;
    case "c":
      return makeTupleComputed(refs as any) as TupleFrom<Refs>;
    case "f":
      return makeTupleFiltered(refs as any) as any as TupleFrom<Refs>;
  }
}

function makeTupleRef<const Refs extends ReadonlyArray<RefSubject<any, any, any>>>(
  refs: Refs,
): RefSubjectTupleFrom<Refs> {
  return new RefSubjectTuple(refs);
}

const UNBOUNDED = { concurrency: "unbounded" } as const;

const sampleRefSubject = (ref: RefSubject.Any): Effect.Effect<any, any, any> =>
  // @effect-diagnostics-next-line unnecessaryEffectGen:off
  Effect.gen(function* () {
    return yield* ref;
  });

function versionedInContext<R0, E0, A, E, R, B, E2, R2>(
  make: () => Versioned.Versioned<R0, E0, A, E, R, B, E2, R2>,
): Versioned.Versioned<R0, E0, A, E, R, B, E2, R2> {
  // Automatic composites share both pushed sessions and in-flight reads only within one Context.
  const contexts = new WeakMap<
    Context.Context<never>,
    Versioned.Versioned<R0, E0, A, E, R, B, E2, R2>
  >();
  const current = Effect.map(Effect.context<never>(), (context) => {
    let versioned = contexts.get(context);
    if (!versioned) {
      versioned = make();
      contexts.set(context, versioned);
    }
    return versioned;
  });
  return new (class extends YieldableFx<A, E, R, B, E2, R2> {
    readonly version = Effect.flatMap(current, (versioned) => versioned.version);
    readonly interrupt = Effect.flatMap(current, (versioned) => versioned.interrupt);

    run<RSink>(sink: Sink.Sink<A, E, RSink>) {
      return Effect.flatMap(current, (versioned) => versioned.run(sink));
    }

    toEffect() {
      return Effect.flatMap(current, identity);
    }
  })();
}

function makeCompositeVersioned(
  refs: ReadonlyArray<RefSubject.Any>,
  current: Effect.Effect<any, any, any>,
): Versioned.Versioned<any, any, any, any, any, any, any, any> {
  const version = Effect.map(
    Effect.all(
      refs.map((ref) => ref.version),
      UNBOUNDED,
    ),
    (versions) => versions.reduce(sum, 0),
  );
  const changes = skipRepeats(fxMapEffect(fxMergeAll(...refs), () => current));

  return versionedInContext(() => Versioned.hold(Versioned.make(version, changes, current)));
}

class RefSubjectTuple<const Refs extends ReadonlyArray<RefSubject<any, any, any>>>
  extends YieldableFx<
    {
      readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
    },
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>,
    {
      readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
    },
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>
  >
  implements RefSubjectTupleFrom<Refs>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  readonly version: Effect.Effect<
    number,
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>
  >;
  readonly interrupt: Effect.Effect<void, never, Effect.Services<Refs[number]>>;
  readonly subscriberCount: Effect.Effect<number, never, Effect.Services<Refs[number]>>;

  private versioned: Versioned.Versioned<
    Effect.Services<Refs[number]>,
    Effect.Error<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Success<Refs[K]> },
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Success<Refs[K]> },
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>
  >;

  private getSetDelete: GetSetDelete<
    { readonly [K in keyof Refs]: Effect.Success<Refs[K]> },
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>
  >;

  readonly refs: Refs;

  constructor(refs: Refs) {
    super();

    this.refs = refs;
    this.versioned = (
      refs.length > 0 && getTupleTransactionAccess(refs)
        ? makeCompositeVersioned(refs, Effect.all(refs.map(sampleRefSubject), UNBOUNDED))
        : versionedInContext(() => Versioned.hold(Versioned.tuple(refs)))
    ) as any;
    this.version = this.versioned.version;
    this.interrupt = Effect.all(
      refs.map((r) => r.interrupt),
      UNBOUNDED,
    );
    this.subscriberCount = Effect.map(
      Effect.all(
        refs.map((r) => r.subscriberCount),
        UNBOUNDED,
      ),
      Array.reduce(0, sum),
    );

    this.getSetDelete = {
      get: this.versioned,
      set: (a) =>
        Effect.all(
          refs.map((r, i) => set(r, a[i])),
          UNBOUNDED,
        ) as any,
      delete: Effect.map(
        Effect.all(
          refs.map((r) => reset(r)),
          UNBOUNDED,
        ),
        Option.all,
      ) as any,
    };

    this.updates = this.updates.bind(this);
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  run<R2 = never>(
    sink: Sink.Sink<
      {
        readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
      },
      Effect.Error<Refs[number]>,
      R2
    >,
  ): Effect.Effect<unknown, never, Effect.Services<Refs[number]> | R2> {
    return this.versioned.run(sink);
  }

  override toEffect(): Effect.Effect<
    { readonly [K in keyof Refs]: Effect.Success<Refs[K]> },
    Effect.Error<Refs[number]>,
    Effect.Services<Refs[number]>
  > {
    return this.versioned;
  }

  updates<E2, R2, C>(
    run: (
      ref: GetSetDelete<
        {
          readonly [K in keyof Refs]: Effect.Success<Refs[K]>;
        },
        Effect.Error<Refs[number]>,
        Effect.Services<Refs[number]>
      >,
    ) => Effect.Effect<C, E2, R2>,
  ): Effect.Effect<C, Effect.Error<Refs[number]> | E2, Effect.Services<Refs[number]> | R2> {
    const accessEffect = getTransactionAccess(this);
    return accessEffect
      ? Effect.flatMap(accessEffect, (transactionAccess) =>
          Option.isSome(transactionAccess)
            ? runTransaction<
                C,
                Effect.Error<Refs[number]> | E2,
                Effect.Services<Refs[number]> | R2
              >(transactionAccess.value, run as any)
            : Effect.suspend(() => run(this.getSetDelete)),
        )
      : Effect.suspend(() => run(this.getSetDelete));
  }

  onFailure(
    cause: Cause.Cause<Effect.Error<Refs[number]>>,
  ): Effect.Effect<unknown, never, Effect.Services<Refs[number]>> {
    return Effect.all(this.refs.map((ref) => ref.onFailure(cause)));
  }

  onSuccess(value: { readonly [K in keyof Refs]: Effect.Success<Refs[K]> }): Effect.Effect<
    unknown,
    never,
    Effect.Services<Refs[number]>
  > {
    return Effect.catchCause(this.getSetDelete.set(value), (c) => this.onFailure(c));
  }
}

function makeTupleComputed<const Refs extends ReadonlyArray<Computed<any, any, any>>>(
  refs: Refs,
): ComputedTupleFrom<Refs> {
  return new ComputedImpl(
    versionedInContext(() => Versioned.tuple(refs)) as any,
    Effect.succeed,
  ) as any;
}

function makeTupleFiltered<
  const Refs extends ReadonlyArray<Computed<any, any, any> | Filtered<any, any, any>>,
>(refs: Refs): FilteredTupleFrom<Refs> {
  return new FilteredImpl(
    versionedInContext(() => Versioned.tuple(refs)) as any,
    Effect.succeedSome,
  ) as any;
}

function makeStructRef<const Refs extends Readonly<Record<string, RefSubject.Any>>>(
  refs: Refs,
): RefSubjectStructFrom<Refs> {
  return new RefSubjectStruct(refs) as any;
}

class RefSubjectStruct<const Refs extends Readonly<Record<string, RefSubject.Any>>>
  extends YieldableFx<
    {
      readonly [K in keyof Refs]: Success<Refs[K]>;
    },
    Error<Refs[keyof Refs]>,
    Services<Refs[keyof Refs]> | Scope.Scope,
    {
      readonly [K in keyof Refs]: Success<Refs[K]>;
    },
    Error<Refs[keyof Refs]>,
    Services<Refs[keyof Refs]>
  >
  implements
    RefSubject<
      {
        readonly [K in keyof Refs]: Success<Refs[K]>;
      },
      Error<Refs[keyof Refs]>,
      Services<Refs[keyof Refs]>
    >
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  readonly version: Effect.Effect<number, Error<Refs[keyof Refs]>, Services<Refs[keyof Refs]>>;
  readonly interrupt: Effect.Effect<void, never, Services<Refs[keyof Refs]>>;
  readonly subscriberCount: Effect.Effect<number, never, Services<Refs[keyof Refs]>>;

  private versioned: Versioned.Versioned<
    Services<Refs[keyof Refs]>,
    Error<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Success<Refs[K]> },
    Error<Refs[keyof Refs]>,
    Services<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Success<Refs[K]> },
    Error<Refs[keyof Refs]>,
    Services<Refs[keyof Refs]>
  >;

  private getSetDelete: GetSetDelete<
    { readonly [K in keyof Refs]: Success<Refs[K]> },
    Error<Refs[keyof Refs]>,
    Services<Refs[keyof Refs]>
  >;

  readonly refs: Refs;

  constructor(refs: Refs) {
    super();

    this.refs = refs;
    const keys = Object.keys(refs);
    const current = Effect.map(
      Effect.all(
        keys.map((key) => sampleRefSubject(refs[key] as RefSubject.Any)),
        UNBOUNDED,
      ),
      (values) => Object.fromEntries(keys.map((key, index) => [key, values[index]])),
    );
    this.versioned = (
      keys.length > 0 && getStructTransactionAccess(refs)
        ? makeCompositeVersioned(Object.values(refs), current)
        : versionedInContext(() => Versioned.hold(Versioned.struct(refs)))
    ) as any;
    this.version = this.versioned.version;
    this.interrupt = Effect.all(
      Object.values(refs).map((r) => r.interrupt),
      UNBOUNDED,
    );
    this.subscriberCount = Effect.map(
      Effect.all(
        Object.values(refs).map((r) => r.subscriberCount),
        UNBOUNDED,
      ),
      Array.reduce(0, sum),
    );

    this.getSetDelete = {
      get: this.versioned,
      set: (a) =>
        Effect.all(
          Object.keys(refs).map((k) => set(refs[k] as any, a[k])),
          UNBOUNDED,
        ) as any,
      delete: Effect.map(
        Effect.all(
          Object.values(refs).map((r) => reset(r as any)),
          UNBOUNDED,
        ),
        Option.all,
      ) as any,
    };

    this.updates = this.updates.bind(this);
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  run<R3 = never>(
    sink: Sink.Sink<{ readonly [K in keyof Refs]: Success<Refs[K]> }, Error<Refs[keyof Refs]>, R3>,
  ): Effect.Effect<unknown, never, Services<Refs[keyof Refs]> | Scope.Scope | R3> {
    return this.versioned.run(sink as any) as any;
  }

  toEffect() {
    return this.versioned;
  }

  updates<E2, R2, C>(
    run: (
      ref: GetSetDelete<
        {
          readonly [K in keyof Refs]: Success<Refs[K]>;
        },
        Error<Refs[keyof Refs]>,
        Services<Refs[keyof Refs]>
      >,
    ) => Effect.Effect<C, E2, R2>,
  ): Effect.Effect<C, Error<Refs[keyof Refs]> | E2, Services<Refs[keyof Refs]> | R2> {
    const accessEffect = getTransactionAccess(this);
    return accessEffect
      ? Effect.flatMap(accessEffect, (transactionAccess) =>
          Option.isSome(transactionAccess)
            ? runTransaction<C, Error<Refs[keyof Refs]> | E2, Services<Refs[keyof Refs]> | R2>(
                transactionAccess.value,
                run as any,
              )
            : Effect.suspend(() => run(this.getSetDelete)),
        )
      : Effect.suspend(() => run(this.getSetDelete));
  }

  onFailure(
    cause: Cause.Cause<Error<Refs[keyof Refs]>>,
  ): Effect.Effect<unknown, never, Services<Refs[keyof Refs]>> {
    return Effect.all(Object.values(this.refs).map((ref) => ref.onFailure(cause as any)));
  }

  onSuccess(value: { readonly [K in keyof Refs]: Success<Refs[K]> }): Effect.Effect<
    unknown,
    never,
    Services<Refs[keyof Refs]>
  > {
    return Effect.catchCause(this.getSetDelete.set(value), (c) => this.onFailure(c));
  }
}

function makeStructComputed<const Refs extends Readonly<Record<string, Computed<any, any, any>>>>(
  refs: Refs,
): ComputedStructFrom<Refs> {
  return new ComputedImpl(
    versionedInContext(() => Versioned.struct(refs)) as any,
    Effect.succeed,
  ) as any;
}

function makeStructFiltered<
  const Refs extends Readonly<Record<string, Computed<any, any, any> | Filtered<any, any, any>>>,
>(refs: Refs): FilteredStructFrom<Refs> {
  return new FilteredImpl(
    versionedInContext(() => Versioned.struct(refs)) as any,
    Effect.succeedSome,
  ) as any;
}

/**
 * Lifts an Effect-provided Computed into a Computed facade.
 *
 * @remarks
 * ## Why
 *
 * Defers service lookup until each version read, current read, interruption, or Fx observation, so
 * callers can compose a Context-provided Computed without manually flat-mapping the service Effect.
 *
 * ## Ownership and lifetime
 *
 * The facade caches neither the resolved Computed nor its value. Each operation runs the supplied
 * Effect, then delegates to the resolved Computed. Service requirements combine as `R | R2`, source
 * failures remain `E`, and the observing Scope owns the delegated subscription.
 *
 * @since 1.18.0
 * @category Services
 */
export function computedFromService<R, A, E, R2>(
  effect: Effect.Effect<Computed<A, E, R2>, never, R>,
): Computed<A, E, R | R2> {
  return new ComputedFromService(effect);
}

class ComputedFromService<R, A, E, R2>
  extends YieldableFx<A, E, R | R2 | Scope.Scope, A, E, R | R2>
  implements Computed<A, E, R | R2>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;

  private readonly effect: Effect.Effect<Computed<A, E, R2>, never, R>;
  readonly version: Effect.Effect<number, E, R | R2>;
  readonly interrupt: Effect.Effect<void, never, R | R2>;

  constructor(effect: Effect.Effect<Computed<A, E, R2>, never, R>) {
    super();
    this.effect = effect;
    this.version = Effect.flatMap(this.effect, (c) => c.version);
    this.interrupt = Effect.flatMap(this.effect, (c) => c.interrupt);
  }

  run<RSink>(
    sink: Sink.Sink<A, E, RSink>,
  ): Effect.Effect<unknown, never, R | R2 | RSink | Scope.Scope> {
    return Effect.flatMap(this.effect, (c) => c.run(sink));
  }

  toEffect(): Effect.Effect<A, E, R | R2> {
    return Effect.flatMap(this.effect, (c) => c);
  }
}

/**
 * Defers retrieval of a Filtered value from Effect Context while preserving Filtered behavior.
 *
 * @remarks
 * ## Why
 *
 * Lets a service-provided Filtered participate directly in Effect reads and Fx observation without
 * manually flat-mapping the service tag at every use.
 *
 * ## Ownership and lifetime
 *
 * The filtered from service view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Services
 */
export function filteredFromService<R, A, E, R2>(
  effect: Effect.Effect<Filtered<A, E, R2>, never, R>,
): Filtered<A, E, R | R2> {
  return new FilteredFromService(effect);
}

class FilteredFromService<R, A, E, R2>
  extends YieldableFx<A, E, R | R2 | Scope.Scope, A, E | Cause.NoSuchElementError, R | R2>
  implements Filtered<A, E, R | R2>
{
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId;

  private readonly effect: Effect.Effect<Filtered<A, E, R2>, never, R>;
  readonly version: Effect.Effect<number, E, R | R2>;
  readonly interrupt: Effect.Effect<void, never, R | R2>;

  constructor(effect: Effect.Effect<Filtered<A, E, R2>, never, R>) {
    super();
    this.effect = effect;
    this.version = Effect.flatMap(this.effect, (c) => c.version);
    this.interrupt = Effect.flatMap(this.effect, (c) => c.interrupt);
  }

  run<RSink>(
    sink: Sink.Sink<A, E, RSink>,
  ): Effect.Effect<unknown, never, R | R2 | RSink | Scope.Scope> {
    return Effect.flatMap(this.effect, (c) => c.run(sink));
  }

  toEffect(): Effect.Effect<A, E | Cause.NoSuchElementError, R | R2> {
    return Effect.flatMap(this.effect, (c) => c);
  }

  asComputed(): Computed<Option.Option<A>, E, R | R2> {
    return computedFromService<R, Option.Option<A>, E, R2>(
      Effect.map(this.effect, (c) => c.asComputed()),
    );
  }
}

export * from "./Hydration.js";

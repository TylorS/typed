import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import { hasProperty, isObject, isString } from "effect/Predicate";
import * as Result from "effect/Result";
import * as Schema from "effect/Schema";
import type { Unify } from "effect/Unify";

/**
 * Reports completed work and, when known, the total amount of work.
 *
 * @remarks
 * ## Why
 * Progress belongs to the value so loading and refreshing states can carry the same transportable measurement.
 *
 * ## Ownership and lifetime
 * This plain object acquires no resources. Its `readonly` fields are a TypeScript constraint; the runtime value is not frozen.
 *
 * @example
 * ```ts
 * import type { Progress } from "@typed/async-data"
 * const progress: Progress = { loaded: 4, total: 10 }
 * ```
 *
 * @category State models
 * @since 1.0.0
 */
export interface Progress {
  /**
   * The finite amount of work completed so far.
   * @remarks
   * ## Why
   * A required counter lets consumers render useful progress even when the total is unknown.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing `Progress` value.
   * @category State models
   * @since 1.0.0
   */
  readonly loaded: number;
  /**
   * The finite total amount of work, when the producer knows it.
   * @remarks
   * ## Why
   * Optionality distinguishes indeterminate work from a known total without inventing a sentinel value.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing `Progress` value.
   * @category State models
   * @since 1.0.0
   */
  readonly total?: number | undefined;
}

/**
 * Represents an asynchronous value before work or a result exists.
 * @remarks
 * ## Why
 * A distinct initial state prevents absence from being confused with loading, failure, or a successful `undefined` value.
 * ## Ownership and lifetime
 * This shape acquires no resources. `readonly` is compile-time only; values matching the interface need not be frozen.
 * @example
 * ```ts
 * import { NoData } from "@typed/async-data"
 * const initial = NoData
 * ```
 * @category State models
 * @since 1.0.0
 */
export interface NoData {
  /**
   * The discriminant for the initial state.
   * @remarks
   * ## Why
   * A literal tag enables exhaustive matching without runtime class identity.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly _tag: "NoData";
}

/**
 * Represents active work that has not produced a prior value or failure.
 * @remarks
 * ## Why
 * Loading is separate from refreshing so consumers can decide whether stale content remains available.
 * ## Ownership and lifetime
 * This plain object acquires no resources; the operation it describes is owned elsewhere and the object is not frozen.
 * @example
 * ```ts
 * import { loading } from "@typed/async-data"
 * const state = loading({ loaded: 0 })
 * ```
 * @category State models
 * @since 1.0.0
 */
export interface Loading {
  /**
   * The discriminant for loading without a prior result.
   * @remarks
   * ## Why
   * The literal tag makes loading branches explicit and exhaustively checkable.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly _tag: "Loading";
  /**
   * Optional progress reported by the active producer.
   * @remarks
   * ## Why
   * Keeping progress optional supports both determinate and uninstrumented operations.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly progress?: Progress | undefined;
}

/**
 * Represents a successfully produced value, optionally while it refreshes.
 * @remarks
 * ## Why
 * Success keeps the last usable value available while progress can describe newer work.
 * ## Ownership and lifetime
 * This plain wrapper acquires no resources; ownership of `value` remains with the caller and `readonly` does not freeze either object.
 * @example
 * ```ts
 * import { success } from "@typed/async-data"
 * const state = success({ id: 1 })
 * ```
 * @category State models
 * @since 1.0.0
 */
export interface Success<A> {
  /**
   * The discriminant for a successful value.
   * @remarks
   * ## Why
   * The literal tag enables exhaustive success handling without inspecting the payload.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly _tag: "Success";
  /**
   * The most recently successful value.
   * @remarks
   * ## Why
   * The payload remains directly accessible even when `progress` marks a refresh.
   * ## Ownership and lifetime
   * Inherits the enclosing state's lifetime; the caller retains ownership of the referenced value.
   * @category State models
   * @since 1.0.0
   */
  readonly value: A;
  /**
   * Optional progress for a refresh of the successful value.
   * @remarks
   * ## Why
   * Its presence distinguishes refreshing success from a settled success.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly progress?: Progress | undefined;
}

/**
 * Represents an Effect failure, optionally while a retry refreshes it.
 * @remarks
 * ## Why
 * Retaining the complete Effect `Cause` preserves typed errors, defects, and interruption instead of flattening failure detail.
 * ## Ownership and lifetime
 * This plain wrapper acquires no resources; its `Cause` is persistent, but the wrapper itself is not frozen.
 * @example
 * ```ts
 * import { failure } from "@typed/async-data"
 * import { Cause } from "effect"
 * const state = failure(Cause.fail("offline"))
 * ```
 * See [Effect Cause](https://effect.website/docs/data-types/cause/).
 * @category State models
 * @since 1.0.0
 */
export interface Failure<E> {
  /**
   * The discriminant for a failed computation.
   * @remarks
   * ## Why
   * The literal tag separates failure from absence and loading.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly _tag: "Failure";
  /**
   * The complete Effect cause of failure.
   * @remarks
   * ## Why
   * Cause preservation keeps defects and interruption observable alongside typed failures.
   * ## Ownership and lifetime
   * Inherits the enclosing state's lifetime; Effect Cause is persistent.
   * @category State models
   * @since 1.0.0
   */
  readonly cause: Cause.Cause<E>;
  /**
   * Optional progress for a retry of the failed operation.
   * @remarks
   * ## Why
   * Its presence distinguishes a refreshing failure from a settled failure.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly progress?: Progress | undefined;
}

/**
 * Represents an optimistic value together with the exact state it replaced.
 * @remarks
 * ## Why
 * Preserving history makes rollback and nested optimistic transformations explicit rather than hiding them in renderer state.
 * ## Ownership and lifetime
 * This plain wrapper acquires no resources and retains its previous state; `readonly` is compile-time only.
 * @example
 * ```ts
 * import { optimistic, success } from "@typed/async-data"
 * const state = optimistic(success(1), 2)
 * ```
 * @category State models
 * @since 1.0.0
 */
export interface Optimistic<A, E> {
  /**
   * The discriminant for optimistic state.
   * @remarks
   * ## Why
   * The literal tag enables explicit optimistic handling and cycle-safe traversal.
   * ## Ownership and lifetime
   * Inherits the resource-free lifetime of its enclosing state.
   * @category State models
   * @since 1.0.0
   */
  readonly _tag: "Optimistic";
  /**
   * The value currently presented optimistically.
   * @remarks
   * ## Why
   * Separating the provisional value from history makes pending intent directly observable.
   * ## Ownership and lifetime
   * Inherits the enclosing state's lifetime; the caller retains ownership of the referenced value.
   * @category State models
   * @since 1.0.0
   */
  readonly value: A;
  /**
   * The state to restore or inspect beneath this optimistic layer.
   * @remarks
   * ## Why
   * Explicit history supports deterministic rollback and transformation of nested optimistic states.
   * ## Ownership and lifetime
   * Inherits the enclosing optimistic wrapper's resource-free lifetime.
   * @category State models
   * @since 1.0.0
   */
  readonly previous: AsyncData<A, E>;
}

/**
 * The complete renderer-independent state machine for asynchronous data.
 * @remarks
 * ## Why
 * A closed union makes absence, work, value, failure, and optimistic history compositional and exhaustively matchable.
 * ## Ownership and lifetime
 * AsyncData values acquire no resources; they describe operation state whose execution is owned elsewhere.
 * @example
 * ```ts
 * import type { AsyncData } from "@typed/async-data"
 * import { success } from "@typed/async-data"
 * const state: AsyncData<number, string> = success(1)
 * ```
 * @category State models
 * @since 1.0.0
 */
export type AsyncData<A, E> = NoData | Loading | Success<A> | Failure<E> | Optimistic<A, E>;

/**
 * A success or failure that retains progress for an active refresh.
 * @remarks
 * ## Why
 * This refinement lets consumers distinguish refreshes without losing the previous result.
 * ## Ownership and lifetime
 * This structural view acquires no resources and has the lifetime of the underlying state value.
 * @example
 * ```ts
 * import type { Refreshing } from "@typed/async-data"
 * const state: Refreshing<number, never> = { _tag: "Success", value: 1, progress: { loaded: 0 } }
 * ```
 * @category State models
 * @since 1.0.0
 */
export type Refreshing<A, E> = (Success<A> | Failure<E>) & {
  /** Progress whose presence marks the retained result as actively refreshing. @since 1.0.0 */
  readonly progress: Progress;
};

type EncodedFailure = {
  readonly _tag: "Failure";
  readonly cause: Schema.Json;
  readonly progress?: Progress | undefined;
};

type EncodedOptimistic<A, E> = {
  readonly _tag: "Optimistic";
  readonly value: A;
  readonly previous: EncodedAsyncData<A, E>;
};

type EncodedAsyncData<A, E> =
  | NoData
  | Loading
  | Success<A>
  | EncodedFailure
  | EncodedOptimistic<A, E>;

/**
 * Builds an Effect Schema codec for recursive AsyncData values.
 * @remarks
 * ## Why
 * A codec gives transport boundaries the same state model as application code while encoding `Cause` as JSON and preserving schema service requirements.
 * ## Ownership and lifetime
 * Codec construction is pure and acquires no resources; decoding and encoding use the services declared by the supplied schemas.
 * @example
 * ```ts
 * import { AsyncData } from "@typed/async-data"
 * import { Schema } from "effect"
 * const codec = AsyncData(Schema.String, Schema.String)
 * ```
 * See [Effect Schema](https://effect.website/docs/schema/introduction/).
 * @category Serialization
 * @since 1.0.0
 */
export const AsyncData = <const A extends Schema.Top, E extends Schema.Top>(
  A: A,
  E: E,
): Schema.Codec<
  AsyncData<A["Type"], E["Type"]>,
  EncodedAsyncData<A["Encoded"], E["Encoded"]>,
  A["DecodingServices"] | E["DecodingServices"],
  A["EncodingServices"] | E["EncodingServices"]
> => {
  const Progress = Schema.Struct({ loaded: Schema.Finite, total: Schema.optional(Schema.Finite) });
  const NoData = Schema.Struct({ _tag: Schema.tag("NoData") });
  const Loading = Schema.Struct({
    _tag: Schema.tag("Loading"),
    progress: Schema.optional(Progress),
  });
  const Success = Schema.Struct({
    _tag: Schema.tag("Success"),
    value: A,
    progress: Schema.optional(Progress),
  });
  const CauseSchema = Schema.Cause(E, Schema.Defect());
  const Failure = Schema.Struct({
    _tag: Schema.tag("Failure"),
    cause: Schema.toCodecJson(CauseSchema),
    progress: Schema.optional(Progress),
  });
  const Optimistic = Schema.Struct({
    _tag: Schema.tag("Optimistic"),
    value: A,
    previous: Schema.suspend(() => AsyncDataSchema),
  });
  const AsyncDataSchema = Schema.Union([
    NoData,
    Loading,
    Success,
    Failure,
    Optimistic,
  ]) as Schema.Codec<
    AsyncData<A["Type"], E["Type"]>,
    EncodedAsyncData<A["Encoded"], E["Encoded"]>,
    A["DecodingServices"] | E["DecodingServices"],
    A["EncodingServices"] | E["EncodingServices"]
  >;
  return AsyncDataSchema;
};

/**
 * Tests whether an AsyncData value is `NoData`.
 * @remarks
 * ## Why
 * A named refinement narrows the union without duplicating tag checks.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and does not retain its argument.
 * @example
 * ```ts
 * import { isNoData, NoData } from "@typed/async-data"
 * isNoData(NoData)
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isNoData = <A, E>(asyncData: AsyncData<A, E>): asyncData is NoData =>
  asyncData._tag === "NoData";
/**
 * Tests whether an AsyncData value is loading without a prior result.
 * @remarks
 * ## Why
 * This refinement deliberately excludes refreshing success and failure states.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and does not retain its argument.
 * @example
 * ```ts
 * import { isLoading, loading } from "@typed/async-data"
 * isLoading(loading())
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isLoading = <A, E>(asyncData: AsyncData<A, E>): asyncData is Loading =>
  asyncData._tag === "Loading";
/**
 * Tests whether an AsyncData value contains a successful value.
 * @remarks
 * ## Why
 * This refinement separates settled or refreshing success from optimistic state.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and does not retain its argument.
 * @example
 * ```ts
 * import { isSuccess, success } from "@typed/async-data"
 * isSuccess(success(1))
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isSuccess = <A, E>(asyncData: AsyncData<A, E>): asyncData is Success<A> =>
  asyncData._tag === "Success";
/**
 * Tests whether an AsyncData value contains an Effect Cause.
 * @remarks
 * ## Why
 * The refinement exposes complete failure information without treating optimistic history as a current failure.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and does not retain its argument.
 * @example
 * ```ts
 * import { failure, isFailure } from "@typed/async-data"
 * import { Cause } from "effect"
 * isFailure(failure(Cause.fail("offline")))
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isFailure = <A, E>(asyncData: AsyncData<A, E>): asyncData is Failure<E> =>
  asyncData._tag === "Failure";
/**
 * Tests whether an AsyncData value is an optimistic history node.
 * @remarks
 * ## Why
 * A dedicated refinement makes history traversal explicit and type safe.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and does not retain its argument.
 * @example
 * ```ts
 * import { isOptimistic, optimistic, success } from "@typed/async-data"
 * isOptimistic(optimistic(success(1), 2))
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isOptimistic = <A, E>(asyncData: AsyncData<A, E>): asyncData is Optimistic<A, E> =>
  asyncData._tag === "Optimistic";

const hasValidProgress = (u: object): boolean => {
  if (!hasProperty(u, "progress") || u.progress === undefined) {
    return true;
  }
  const progress = u.progress;
  return (
    isObject(progress) &&
    hasProperty(progress, "loaded") &&
    typeof progress.loaded === "number" &&
    Number.isFinite(progress.loaded) &&
    (!hasProperty(progress, "total") ||
      progress.total === undefined ||
      (typeof progress.total === "number" && Number.isFinite(progress.total)))
  );
};

/**
 * Validates the runtime structure of an unknown AsyncData value.
 * @remarks
 * ## Why
 * Boundary validation rejects malformed progress, failure causes, and cyclic optimistic histories before application logic depends on them.
 * ## Ownership and lifetime
 * Validation is iterative, acquires no resources, and retains no visited objects after returning.
 * @example
 * ```ts
 * import { isAsyncData } from "@typed/async-data"
 * isAsyncData({ _tag: "Loading", progress: { loaded: 1 } })
 * ```
 * @category Runtime validation
 * @since 1.0.0
 */
export const isAsyncData = <A, E>(u: unknown): u is AsyncData<A, E> => {
  const visited = new WeakSet<object>();
  let current = u;
  while (isObject(current) && hasProperty(current, "_tag") && isString(current._tag)) {
    switch (current._tag) {
      case "NoData":
        return true;
      case "Loading":
        return hasValidProgress(current);
      case "Success":
        return hasProperty(current, "value") && hasValidProgress(current);
      case "Failure":
        return (
          hasProperty(current, "cause") && Cause.isCause(current.cause) && hasValidProgress(current)
        );
      case "Optimistic":
        if (
          visited.has(current) ||
          !hasProperty(current, "value") ||
          !hasProperty(current, "previous")
        ) {
          return false;
        }
        visited.add(current);
        current = current.previous;
        break;
      default:
        return false;
    }
  }
  return false;
};

/**
 * Tests whether a success or failure carries active refresh progress.
 * @remarks
 * ## Why
 * Refreshing keeps an existing result visible while making new work observable.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and does not retain its argument.
 * @example
 * ```ts
 * import { isRefreshing, success } from "@typed/async-data"
 * isRefreshing(success("cached", { loaded: 0 }))
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isRefreshing = <A, E>(asyncData: AsyncData<A, E>): asyncData is Refreshing<A, E> =>
  (asyncData._tag === "Success" || asyncData._tag === "Failure") &&
  asyncData.progress !== undefined;

/**
 * Tests whether the base state is loading or refreshing through optimistic history.
 * @remarks
 * ## Why
 * Pending status follows the underlying operation rather than disappearing when optimistic values are layered above it; cycles return `false`.
 *
 * **Known type/runtime discrepancy:** an `Optimistic` wrapper over a pending base returns `true` at runtime, but the existing type predicate narrows to `Loading | Refreshing<A, E>` and excludes `Optimistic`. Do not use this function to narrow before reading `_tag`; use it only as a pending-status boolean and refine the original value separately. The predicate is retained for compatibility and is not an accurate description of every `true` result.
 * ## Ownership and lifetime
 * This iterative predicate acquires no resources and retains no visited objects after returning.
 * @example
 * ```ts
 * import { isPending, loading, optimistic } from "@typed/async-data"
 * isPending(optimistic(loading(), "draft"))
 * ```
 * @category State inspection
 * @since 1.0.0
 */
export const isPending = <A, E>(
  asyncData: AsyncData<A, E>,
): asyncData is Loading | Refreshing<A, E> => {
  const visited = new WeakSet<object>();
  let current: AsyncData<A, E> = asyncData;
  while (isOptimistic(current)) {
    if (visited.has(current)) {
      return false;
    }
    visited.add(current);
    current = current.previous;
  }
  return current._tag === "Loading" || isRefreshing(current);
};

/**
 * The canonical shared initial AsyncData object.
 * @remarks
 * ## Why
 * A shared singleton avoids allocating an equivalent empty state and gives callers an exact constructor value.
 * ## Ownership and lifetime
 * The module owns this resource-free singleton for the process lifetime. It is not frozen: mutation through an unsafe cast changes the shared value for every caller.
 * @example
 * ```ts
 * import { NoData } from "@typed/async-data"
 * const initial = NoData
 * ```
 * @category State construction
 * @since 1.0.0
 */
export const NoData: NoData = { _tag: "NoData" };

/**
 * Creates a loading state with optional progress.
 * @remarks
 * ## Why
 * The constructor keeps state creation consistent with the discriminated union.
 * ## Ownership and lifetime
 * This pure function acquires no resources and returns a new wrapper.
 * @example
 * ```ts
 * import { loading } from "@typed/async-data"
 * const state = loading({ loaded: 2, total: 5 })
 * ```
 * @category State construction
 * @since 1.0.0
 */
export const loading = (progress?: Progress): Loading => ({ _tag: "Loading", progress });

/**
 * Creates a successful state with optional refresh progress.
 * @remarks
 * ## Why
 * The constructor preserves the payload type while making refresh state explicit.
 * ## Ownership and lifetime
 * This pure function acquires no resources; the returned wrapper retains the supplied value.
 * @example
 * ```ts
 * import { success } from "@typed/async-data"
 * const state = success("ready")
 * ```
 * @category State construction
 * @since 1.0.0
 */
export const success = <A>(value: A, progress?: Progress): Success<A> => ({
  _tag: "Success",
  value,
  progress,
});

/**
 * Creates a failed state while preserving the complete Effect Cause.
 * @remarks
 * ## Why
 * Accepting `Cause` prevents typed failures, defects, and interruption from being collapsed into one error value.
 * ## Ownership and lifetime
 * This pure function acquires no resources; the returned wrapper retains the supplied persistent Cause.
 * @example
 * ```ts
 * import { failure } from "@typed/async-data"
 * import { Cause } from "effect"
 * const state = failure(Cause.fail("offline"))
 * ```
 * @category State construction
 * @since 1.0.0
 */
export const failure = <E>(cause: Cause.Cause<E>, progress?: Progress): Failure<E> => ({
  _tag: "Failure",
  cause,
  progress,
});

/**
 * Adds an optimistic value above an existing AsyncData history.
 * @remarks
 * ## Why
 * Keeping `previous` makes rollback and reconciliation explicit rather than mutating or discarding earlier state.
 * ## Ownership and lifetime
 * This pure function acquires no resources; the wrapper retains both supplied values.
 * @example
 * ```ts
 * import { optimistic, success } from "@typed/async-data"
 * const state = optimistic(success("saved"), "saving")
 * ```
 * @category Optimistic transitions
 * @since 1.0.0
 */
export const optimistic = <A, E>(previous: AsyncData<A, E>, value: A): Optimistic<A, E> => ({
  _tag: "Optimistic",
  value,
  previous,
});

const optimisticHistory = <A, E>(data: AsyncData<A, E>) => {
  const values: Array<A> = [];
  const visited = new WeakSet<object>();
  let current = data;
  while (isOptimistic(current)) {
    if (visited.has(current)) {
      throw new TypeError("Cyclic Optimistic history");
    }
    visited.add(current);
    values.push(current.value);
    current = current.previous;
  }
  return { base: current, values };
};

const rebuildOptimistic = <A, E>(base: AsyncData<A, E>, values: ReadonlyArray<A>) => {
  let current = base;
  for (let index = values.length - 1; index >= 0; index--) {
    current = optimistic(current, values[index]!);
  }
  return current;
};

const refreshingProgress = (progress?: Progress, existing?: Progress): Progress =>
  progress ?? existing ?? { loaded: 0 };

/**
 * Starts loading while preserving successful, failed, and optimistic history.
 * @remarks
 * ## Why
 * Refreshes should keep usable values or causes visible, and optimistic layers must remain in their original order. Cyclic history throws `TypeError`.
 * ## Ownership and lifetime
 * This pure transformation acquires no resources and returns new plain wrappers where rebuilding is needed.
 * @example
 * ```ts
 * import { startLoading, success } from "@typed/async-data"
 * const refreshing = startLoading(success("cached"))
 * ```
 * @category Refresh transitions
 * @since 1.0.0
 */
export const startLoading = <A, E>(data: AsyncData<A, E>, progress?: Progress): AsyncData<A, E> => {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<A, E>;
  if (isSuccess(base)) {
    result = success(base.value, refreshingProgress(progress, base.progress));
  } else if (isFailure(base)) {
    result = failure(base.cause, refreshingProgress(progress, base.progress));
  } else if (isLoading(base)) {
    result = loading(progress ?? base.progress);
  } else {
    result = loading(progress);
  }
  return rebuildOptimistic(result, values);
};

/**
 * Stops loading or refreshing without discarding optimistic history.
 * @remarks
 * ## Why
 * Removing progress settles success and failure while leaving initial or loading state semantics predictable. Cyclic history throws `TypeError`.
 * ## Ownership and lifetime
 * This pure transformation acquires no resources and returns new plain wrappers where rebuilding is needed.
 * @example
 * ```ts
 * import { startLoading, stopLoading, success } from "@typed/async-data"
 * const settled = stopLoading(startLoading(success("cached")))
 * ```
 * @category Refresh transitions
 * @since 1.0.0
 */
export const stopLoading = <A, E>(data: AsyncData<A, E>): AsyncData<A, E> => {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<A, E>;
  if (isSuccess(base)) {
    result = success(base.value);
  } else if (isFailure(base)) {
    result = failure(base.cause);
  } else {
    result = base;
  }
  return rebuildOptimistic(result, values);
};

/**
 * Exhaustively folds every AsyncData variant, in data-first or data-last form.
 * @remarks
 * ## Why
 * Centralized exhaustive dispatch exposes values and Causes with their full state while TypeScript unifies branch result types.
 * ## Ownership and lifetime
 * Matching is synchronous, acquires no resources, and retains nothing beyond callback behavior.
 * @example
 * ```ts
 * import { match } from "@typed/async-data"
 * const label = match({ NoData: () => "empty", Loading: () => "loading", Failure: () => "failed", Success: String, Optimistic: String })
 * ```
 * @category Pattern matching
 * @since 1.0.0
 */
export const match: {
  <A, E, R1, R2, R3, R4, R5>(matchers: {
    NoData: (data: NoData) => R1;
    Loading: (data: Loading) => R2;
    Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3;
    Success: (value: A, data: Success<A>) => R4;
    Optimistic: (value: A, data: Optimistic<A, E>) => R5;
  }): (data: AsyncData<A, E>) => Unify<R1 | R2 | R3 | R4 | R5>;

  <A, E, R1, R2, R3, R4, R5>(
    data: AsyncData<A, E>,
    matchers: {
      NoData: (data: NoData) => R1;
      Loading: (data: Loading) => R2;
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3;
      Success: (value: A, data: Success<A>) => R4;
      Optimistic: (value: A, data: Optimistic<A, E>) => R5;
    },
  ): Unify<R1 | R2 | R3 | R4 | R5>;
} = dual(
  2,
  <A, E, R1, R2, R3, R4, R5>(
    data: AsyncData<A, E>,
    matchers: {
      NoData: (data: NoData) => R1;
      Loading: (data: Loading) => R2;
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3;
      Success: (value: A, data: Success<A>) => R4;
      Optimistic: (value: A, data: Optimistic<A, E>) => R5;
    },
  ): Unify<R1 | R2 | R3 | R4> => {
    if (isSuccess(data)) {
      return matchers.Success(data.value, data) as Unify<R1 | R2 | R3 | R4>;
    } else if (isFailure(data)) {
      return matchers.Failure(data.cause, data) as Unify<R1 | R2 | R3 | R4>;
    } else if (isLoading(data)) {
      return matchers.Loading(data) as Unify<R1 | R2 | R3 | R4>;
    } else if (isNoData(data)) {
      return matchers.NoData(data) as Unify<R1 | R2 | R3 | R4>;
    } else {
      return matchers.Optimistic(data.value, data) as Unify<R1 | R2 | R3 | R4>;
    }
  },
);

/**
 * Returns the current successful or optimistic value as an Effect `Option`.
 * @remarks
 * ## Why
 * `Option` distinguishes an absent value from a present `undefined` payload and composes with Effect's data APIs.
 * ## Ownership and lifetime
 * This pure lookup acquires no resources and does not retain the state.
 * @example
 * ```ts
 * import { getSuccess, success } from "@typed/async-data"
 * const value = getSuccess(success(1))
 * ```
 * See [Effect Option](https://effect.website/docs/data-types/option/).
 * @category State extraction
 * @since 1.0.0
 */
export function getSuccess<A, E>(data: AsyncData<A, E>): Option.Option<A> {
  return match(data, {
    NoData: Option.none,
    Loading: Option.none,
    Failure: Option.none,
    Success: Option.some,
    Optimistic: Option.some,
  });
}

/**
 * Returns the complete Cause only when the current state is a Failure.
 * @remarks
 * ## Why
 * The accessor keeps typed errors, defects, and interruption intact for callers that need full failure diagnostics.
 * ## Ownership and lifetime
 * This pure lookup acquires no resources and returns a reference to the persistent Cause.
 * @example
 * ```ts
 * import { failure, getCause } from "@typed/async-data"
 * import { Cause } from "effect"
 * const cause = getCause(failure(Cause.fail("offline")))
 * ```
 * @category State extraction
 * @since 1.0.0
 */
export function getCause<A, E>(data: AsyncData<A, E>): Option.Option<Cause.Cause<E>> {
  return match(data, {
    NoData: Option.none,
    Loading: Option.none,
    Failure: Option.some,
    Success: Option.none,
    Optimistic: Option.none,
  });
}

/**
 * Returns the first typed failure found in a Failure Cause.
 * @remarks
 * ## Why
 * This convenience accessor intentionally excludes defects and interruption; use `getCause` when those distinctions matter.
 * ## Ownership and lifetime
 * This pure lookup acquires no resources and does not retain the state.
 * @example
 * ```ts
 * import { failure, getError } from "@typed/async-data"
 * import { Cause } from "effect"
 * const error = getError(failure(Cause.fail("offline")))
 * ```
 * @category State extraction
 * @since 1.0.0
 */
export function getError<A, E>(data: AsyncData<A, E>): Option.Option<E> {
  return match(data, {
    NoData: Option.none,
    Loading: Option.none,
    Failure: Cause.findErrorOption,
    Success: Option.none,
    Optimistic: Option.none,
  });
}

/**
 * Maps successful and every optimistic value while preserving state structure.
 * @remarks
 * ## Why
 * Value transformations should not erase progress, Causes, or optimistic rollback history. Cyclic history throws `TypeError`.
 * ## Ownership and lifetime
 * This pure transformation acquires no resources and returns new plain wrappers.
 * @example
 * ```ts
 * import { map, success } from "@typed/async-data"
 * const state = map(success(2), (n) => n * 2)
 * ```
 * @category Value transformations
 * @since 1.0.0
 */
export const map: {
  <A, B>(f: (a: A) => B): <E>(data: AsyncData<A, E>) => AsyncData<B, E>;
  <A, E, B>(data: AsyncData<A, E>, f: (a: A) => B): AsyncData<B, E>;
} = dual(2, function map<A, E, B>(data: AsyncData<A, E>, f: (a: A) => B): AsyncData<B, E> {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<B, E>;
  if (isSuccess(base)) {
    result = success(f(base.value), base.progress);
  } else {
    result = base;
  }
  for (let index = values.length - 1; index >= 0; index--) {
    result = optimistic(result, f(values[index]!));
  }
  return result;
});

/**
 * Replaces a successful or outer optimistic value with another AsyncData value.
 * @remarks
 * ## Why
 * State-producing transformations can change both value and error types while non-value states pass through unchanged.
 * ## Ownership and lifetime
 * This pure transformation acquires no resources; ownership follows the AsyncData returned by the callback.
 * @example
 * ```ts
 * import { flatMap, success } from "@typed/async-data"
 * const parsed = flatMap(success("2"), (text) => success(Number(text)))
 * ```
 * @category Value transformations
 * @since 1.0.0
 */
export const flatMap: {
  <A, B, E2>(
    f: (a: A, data: Success<A> | Optimistic<A, unknown>) => AsyncData<B, E2>,
  ): <E>(data: AsyncData<A, E>) => AsyncData<B, E | E2>;
  <A, E, B, E2>(
    data: AsyncData<A, E>,
    f: (a: A, data: Success<A> | Optimistic<A, E>) => AsyncData<B, E2>,
  ): AsyncData<B, E | E2>;
} = dual(2, function <
  A,
  E,
  B,
  E2,
>(data: AsyncData<A, E>, f: (a: A, data: Success<A> | Optimistic<A, E>) => AsyncData<B, E2>): AsyncData<
  B,
  E | E2
> {
  if (isSuccess(data) || isOptimistic(data)) {
    return f(data.value, data);
  } else {
    return data;
  }
});

/**
 * Maps typed failures inside the base Cause while preserving defects, interruption, progress, and optimistic history.
 * @remarks
 * ## Why
 * Error adaptation should use Effect Cause semantics instead of flattening the failure channel. Cyclic history throws `TypeError`.
 * ## Ownership and lifetime
 * This pure transformation acquires no resources and returns new plain wrappers.
 * @example
 * ```ts
 * import { failure, mapError } from "@typed/async-data"
 * import { Cause } from "effect"
 * const state = mapError(failure(Cause.fail(404)), String)
 * ```
 * @category Failure transformations
 * @since 1.0.0
 */
export const mapError: {
  <A, E, E2>(f: (e: E) => E2): (data: AsyncData<A, E>) => AsyncData<A, E2>;
  <A, E, E2>(data: AsyncData<A, E>, f: (e: E) => E2): AsyncData<A, E2>;
} = dual(2, function mapError<A, E, E2>(data: AsyncData<A, E>, f: (e: E) => E2): AsyncData<A, E2> {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<A, E2>;
  if (isFailure(base)) {
    result = failure(Cause.map(base.cause, f), base.progress);
  } else {
    result = base;
  }
  return rebuildOptimistic(result, values);
});

/**
 * Converts an Effect Exit to Success or Failure without losing its Cause.
 * @remarks
 * ## Why
 * Exit is Effect's complete computation result, so preserving its Cause keeps typed failures, defects, and interruption available.
 * ## Ownership and lifetime
 * This pure conversion acquires no resources and retains the Exit payload or Cause.
 * @example
 * ```ts
 * import { fromExit } from "@typed/async-data"
 * import { Exit } from "effect"
 * const state = fromExit(Exit.succeed(1))
 * ```
 * @category Effect outcome conversion
 * @since 1.0.0
 */
export const fromExit = <A, E>(exit: Exit.Exit<A, E>): AsyncData<A, E> =>
  Exit.isSuccess(exit) ? success(exit.value) : failure(exit.cause);

/**
 * Converts an Effect Result to Success or a typed Failure Cause.
 * @remarks
 * ## Why
 * Result has only typed success/failure, so a failed result becomes `Cause.fail` without inventing defects or interruption.
 * ## Ownership and lifetime
 * This pure conversion acquires no resources and retains the Result payload.
 * @example
 * ```ts
 * import { fromResult } from "@typed/async-data"
 * import { Result } from "effect"
 * const state = fromResult(Result.succeed(1))
 * ```
 * @category Effect outcome conversion
 * @since 1.0.0
 */
export const fromResult = <A, E>(result: Result.Result<A, E>): AsyncData<A, E> =>
  Result.isSuccess(result) ? success(result.success) : failure(Cause.fail(result.failure));

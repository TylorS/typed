/**
 * Extensions to RefSubject for working with Result values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import * as Result from "effect/Result";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefResult is a RefSubject specialized over a Result value.
 * @remarks
 * ## Why
 *
 * Defines result state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefResult is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefResult<
  in out A,
  in out ResultE,
  in out Err = never,
  out R = never,
> extends RefSubject.RefSubject<Result.Result<A, ResultE>, Err, R> {}

/**
 * Creates a new `RefResult` from a Result, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates result state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, Result } from "effect"
 * import * as RefResult from "@typed/fx/RefResult"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefResult.make(Result.succeed(42))
 *   const current = yield* value
 *   console.log(current) // { _tag: "Success", success: 42 }
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<A, ResultE, Err = never, R = never>(
  initial:
    | Result.Result<A, ResultE>
    | Effect.Effect<Result.Result<A, ResultE>, Err, R>
    | Fx.Fx<Result.Result<A, ResultE>, Err, R>,
  successEq: Equivalence<A> = Equivalence_.strictEqual(),
  failureEq: Equivalence<ResultE> = Equivalence_.strictEqual(),
): Effect.Effect<RefResult<A, ResultE, Err, R>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Result.makeEquivalence(successEq, failureEq) });
}

/**
 * Set the current state of a RefResult to Success(value).
 * @remarks
 * ## Why
 *
 * Keeps set success atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set success performs one serialized result transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setSuccess: {
  <A>(
    value: A,
  ): <ResultE, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
  ) => Effect.Effect<Result.Result<A, ResultE>, Err, R>;
  <A, ResultE, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
    value: A,
  ): Effect.Effect<Result.Result<A, ResultE>, Err, R>;
} = dual(2, function setSuccess<A, ResultE, Err, R>(ref: RefResult<A, ResultE, Err, R>, value: A) {
  return RefSubject.set(ref, Result.succeed(value));
});

/**
 * Set the current state of a RefResult to Failure(error).
 * @remarks
 * ## Why
 *
 * Keeps set failure atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set failure performs one serialized result transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setFailure: {
  <ResultE>(
    error: ResultE,
  ): <A, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
  ) => Effect.Effect<Result.Result<A, ResultE>, Err, R>;
  <A, ResultE, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
    error: ResultE,
  ): Effect.Effect<Result.Result<A, ResultE>, Err, R>;
} = dual(2, function setFailure<
  A,
  ResultE,
  Err,
  R,
>(ref: RefResult<A, ResultE, Err, R>, error: ResultE) {
  return RefSubject.set(ref, Result.fail(error));
});

// ========================================
// Computed
// ========================================

/**
 * Map the success value of a RefResult.
 * @remarks
 * ## Why
 *
 * Projects result state with map for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const map: {
  <A, B>(
    f: (a: A) => B,
  ): <ResultE, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
  ) => RefSubject.Computed<Result.Result<B, ResultE>, Err, R>;
  <A, ResultE, Err, R, B>(
    ref: RefResult<A, ResultE, Err, R>,
    f: (a: A) => B,
  ): RefSubject.Computed<Result.Result<B, ResultE>, Err, R>;
} = dual(2, function map<
  A,
  ResultE,
  Err,
  R,
  B,
>(ref: RefResult<A, ResultE, Err, R>, f: (a: A) => B) {
  return RefSubject.map(ref, (self) => Result.map(self, f));
});

/**
 * Map the error value of a RefResult.
 * @remarks
 * ## Why
 *
 * Projects result state with map error for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map error view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const mapError: {
  <ResultE, ResultE2>(
    f: (e: ResultE) => ResultE2,
  ): <A, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
  ) => RefSubject.Computed<Result.Result<A, ResultE2>, Err, R>;
  <A, ResultE, Err, R, ResultE2>(
    ref: RefResult<A, ResultE, Err, R>,
    f: (e: ResultE) => ResultE2,
  ): RefSubject.Computed<Result.Result<A, ResultE2>, Err, R>;
} = dual(2, function mapError<
  A,
  ResultE,
  Err,
  R,
  ResultE2,
>(ref: RefResult<A, ResultE, Err, R>, f: (e: ResultE) => ResultE2) {
  return RefSubject.map(ref, (self) => Result.mapError(self, f));
});

/**
 * FlatMap the success value of a RefResult.
 * @remarks
 * ## Why
 *
 * Projects only successful values with `Result.flatMap` while preserving failures; current reads
 * and future pushes use the same read-only derivation.
 *
 * ## Ownership and lifetime
 *
 * The flat map view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const flatMap: {
  <A, B, ResultE2>(
    f: (a: A) => Result.Result<B, ResultE2>,
  ): <ResultE, Err, R>(
    ref: RefResult<A, ResultE, Err, R>,
  ) => RefSubject.Computed<Result.Result<B, ResultE | ResultE2>, Err, R>;
  <A, ResultE, Err, R, B, ResultE2>(
    ref: RefResult<A, ResultE, Err, R>,
    f: (a: A) => Result.Result<B, ResultE2>,
  ): RefSubject.Computed<Result.Result<B, ResultE | ResultE2>, Err, R>;
} = dual(2, function flatMap<
  A,
  ResultE,
  Err,
  R,
  B,
  ResultE2,
>(ref: RefResult<A, ResultE, Err, R>, f: (a: A) => Result.Result<B, ResultE2>) {
  return RefSubject.map(ref, (self) => Result.flatMap(self, f));
});

/**
 * Check if the current state of a RefResult is Success.
 * @remarks
 * ## Why
 *
 * Exposes the Result success discriminator as Computed state without changing or duplicating the
 * RefResult.
 *
 * ## Ownership and lifetime
 *
 * The is success view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isSuccess = <A, ResultE, Err, R>(
  ref: RefResult<A, ResultE, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Result.isSuccess);

/**
 * Check if the current state of a RefResult is Failure.
 * @remarks
 * ## Why
 *
 * Exposes the Result failure discriminator as Computed state without changing or duplicating the
 * RefResult.
 *
 * ## Ownership and lifetime
 *
 * The is failure view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isFailure = <A, ResultE, Err, R>(
  ref: RefResult<A, ResultE, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Result.isFailure);

/**
 * Match on the Result value.
 * @remarks
 * ## Why
 *
 * Folds both Result variants into one Computed value, applying the same handlers to current reads
 * and subsequent pushes.
 *
 * ## Ownership and lifetime
 *
 * The match view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const match: {
  <A, ResultE, B>(options: {
    readonly onSuccess: (a: A) => B;
    readonly onFailure: (e: ResultE) => B;
  }): <Err, R>(ref: RefResult<A, ResultE, Err, R>) => RefSubject.Computed<B, Err, R>;
  <A, ResultE, Err, R, B>(
    ref: RefResult<A, ResultE, Err, R>,
    options: {
      readonly onSuccess: (a: A) => B;
      readonly onFailure: (e: ResultE) => B;
    },
  ): RefSubject.Computed<B, Err, R>;
} = dual(
  2,
  function match<A, ResultE, Err, R, B>(
    ref: RefResult<A, ResultE, Err, R>,
    options: {
      readonly onSuccess: (a: A) => B;
      readonly onFailure: (e: ResultE) => B;
    },
  ) {
    return RefSubject.map(ref, (self) => Result.match(self, options));
  },
);

// ========================================
// Filtered
// ========================================

/**
 * Get the success value from the Result as a Filtered (fails if Failure).
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get success as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get success view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getSuccess = <A, ResultE, Err, R>(
  ref: RefResult<A, ResultE, Err, R>,
): RefSubject.Filtered<A, Err, R> => RefSubject.filterMap(ref, Result.getSuccess);

/**
 * Get the failure value from the Result as a Filtered (fails if Success).
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get failure as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get failure view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getFailure = <A, ResultE, Err, R>(
  ref: RefResult<A, ResultE, Err, R>,
): RefSubject.Filtered<ResultE, Err, R> => RefSubject.filterMap(ref, Result.getFailure);

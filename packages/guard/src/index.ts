/**
 * @since 1.0.0
 */

import type * as Arr from "effect/Array";
import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import type * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import type { ParseOptions } from "effect/SchemaAST";
import type * as Context from "effect/Context";
import type { ExcludeTag, ExtractTag, NoInfer, Tags } from "effect/Types";
export { getGuard } from "./getGuard.js";
import { getGuard } from "./getGuard.js";

/**
 * An effectful partial transformation.
 *
 * A successful `Some` contains a match, a successful `None` means the input did
 * not match, and an Effect failure remains in the `E` channel. Required
 * services remain in `R`.
 *
 * @remarks
 * ## Why
 * `Guard` models non-match as successful `None`, keeping ordinary dispatch separate from typed failure, defects, and interruption in Effect's Cause.
 *
 * ## Ownership and lifetime
 * A Guard acquires no resources by itself; each invocation has the lifetime and service requirements of the returned Effect.
 *
 * See [Effect Option](https://effect.website/docs/data-types/option/) and [Effect error management](https://effect.website/docs/v4/error-management/expected-errors/).
 *
 * @example
 * ```ts
 * import type { Guard } from "@typed/guard"
 * import { Effect, Option } from "effect"
 * const string: Guard<unknown, string> = (input) => Effect.succeed(typeof input === "string" ? Option.some(input) : Option.none())
 * ```
 *
 * @category Guard contracts
 * @since 1.0.0
 */
export type Guard<in I, out O, out E = never, out R = never> = (
  input: I,
) => Effect.Effect<Option.Option<O>, E, R>;

/**
 * @since 1.0.0
 */
export namespace Guard {
  /**
   * Extracts the accepted input type from a Guard or Guard adapter.
   * @remarks
   * ## Why
   * The extractor keeps generic APIs aligned with the exact input contract without repeating inference logic.
   * ## Ownership and lifetime
   * This compile-time type acquires no resources and has no runtime lifetime.
   * @example
   * ```ts
   * import type { Guard } from "@typed/guard"
   * type Input = Guard.Input<Guard<string, number>>
   * ```
   * @category Type utilities
   * @since 1.0.0
   */
  export type Input<T> = [T] extends [Guard<infer I, infer _R, infer _E, infer _O>]
    ? I
    : [T] extends [AsGuard<infer I, infer _R, infer _E, infer _O>]
      ? I
      : never;

  /**
   * Extracts the Effect service requirements from a Guard or Guard adapter.
   * @remarks
   * ## Why
   * Service extraction makes environment composition visible in combinator signatures.
   * ## Ownership and lifetime
   * This compile-time type acquires no resources; service lifetime is governed by the resulting Effect or Layer.
   * @example
   * ```ts
   * import type { Guard } from "@typed/guard"
   * type Services = Guard.Services<Guard<string, number, never, { readonly Db: unique symbol }>>
   * ```
   * @category Type utilities
   * @since 1.0.0
   */
  export type Services<T> = [T] extends [Guard<infer _I, infer _O, infer _E, infer R>]
    ? R
    : [T] extends [AsGuard<infer _I, infer _O, infer _E, infer R>]
      ? R
      : never;

  /**
   * Extracts the typed error channel from a Guard or Guard adapter.
   * @remarks
   * ## Why
   * Typed failure remains distinct from `None`, defects, and interruption throughout composition.
   * ## Ownership and lifetime
   * This compile-time type acquires no resources and has no runtime lifetime.
   * @example
   * ```ts
   * import type { Guard } from "@typed/guard"
   * type Error = Guard.Error<Guard<string, number, "Invalid">>
   * ```
   * @category Type utilities
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [Guard<infer _I, infer _O, infer E, infer _R>]
    ? E
    : [T] extends [AsGuard<infer _I, infer _O, infer E, infer _R>]
      ? E
      : never;

  /**
   * Extracts the matched output type from a Guard or Guard adapter.
   * @remarks
   * ## Why
   * The extractor lets record and dispatch combinators derive their output without duplicating conditional types.
   * ## Ownership and lifetime
   * This compile-time type acquires no resources and has no runtime lifetime.
   * @example
   * ```ts
   * import type { Guard } from "@typed/guard"
   * type Output = Guard.Output<Guard<string, number>>
   * ```
   * @category Type utilities
   * @since 1.0.0
   */
  export type Output<T> = [T] extends [Guard<infer _I, infer O, infer _E, infer _R>]
    ? O
    : [T] extends [AsGuard<infer _I, infer O, infer _E, infer _R>]
      ? O
      : never;
}

/**
 * An object that supplies a Guard through an own callable `asGuard` property.
 * Use an instance field rather than a prototype method.
 *
 * @remarks
 * ## Why
 * An explicit adapter protocol lets domain objects participate in Guard composition without inheritance or wrapper allocation.
 *
 * ## Ownership and lifetime
 * The adapter acquires no resources; the returned Guard owns no lifetime beyond each returned Effect.
 *
 * @example
 * ```ts
 * import type { AsGuard, Guard } from "@typed/guard"
 * import { Effect } from "effect"
 * const adapter: AsGuard<string, string> = { asGuard: () => ((input) => Effect.succeedSome(input)) as Guard<string, string> }
 * ```
 *
 * @category Guard contracts
 * @since 1.0.0
 */
export interface AsGuard<in I, out O, out E = never, out R = never> {
  /**
   * Returns the Guard represented by this adapter.
   * @remarks
   * ## Why
   * Requiring an own callable property avoids ambiguous prototype behavior when adapters cross object boundaries.
   * ## Ownership and lifetime
   * Calling this property acquires no resources; the returned Guard follows its own Effect lifetime.
   * @category Guard contracts
   * @since 1.0.0
   */
  readonly asGuard: () => Guard<I, O, E, R>;
}

/**
 * A Guard or an object that supplies one. Guard combinators accept either form.
 *
 * @remarks
 * ## Why
 * A single input contract lets every combinator accept direct functions and domain adapters consistently.
 *
 * ## Ownership and lifetime
 * This union acquires no resources; normalization does not extend the lifetime of either alternative.
 *
 * @example
 * ```ts
 * import type { GuardInput } from "@typed/guard"
 * import { liftPredicate } from "@typed/guard"
 * const input: GuardInput<unknown, string> = liftPredicate((value: unknown): value is string => typeof value === "string")
 * ```
 *
 * @category Guard contracts
 * @since 1.0.0
 */
export type GuardInput<I, O, E = never, R = never> = Guard<I, O, E, R> | AsGuard<I, O, E, R>;

type RecordOutputConstraint<O> = O extends object
  ? O extends ReadonlyArray<unknown>
    ? never
    : unknown
  : never;

const invokeGuard = <I, O, E, R>(
  guard: Guard<I, O, E, R>,
  input: I,
): Effect.Effect<Option.Option<O>, E, R> => Effect.suspend(() => guard(input));

const isObjectRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertObjectRecord = (value: unknown): Record<PropertyKey, unknown> => {
  if (!isObjectRecord(value)) {
    throw new TypeError("Expected a guard object output");
  }
  return value;
};

const copyEnumerableRecord = (
  source: Record<PropertyKey, unknown>,
): Record<PropertyKey, unknown> => {
  const output: Record<PropertyKey, unknown> = {};
  for (const key of Reflect.ownKeys(source)) {
    if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
    output[key] = source[key];
  }
  return output;
};

const extendEnumerableRecord = (
  source: Record<PropertyKey, unknown>,
  key: PropertyKey,
  value: unknown,
): Record<PropertyKey, unknown> => {
  if (Object.prototype.propertyIsEnumerable.call(source, key)) {
    throw new TypeError(`Guard output already contains key: ${String(key)}`);
  }
  const output = copyEnumerableRecord(source);
  output[key] = value;
  return output;
};

const mergeEnumerableRecords = (
  base: Record<PropertyKey, unknown>,
  extension: Record<PropertyKey, unknown>,
): Record<PropertyKey, unknown> => {
  const output = copyEnumerableRecord(base);
  for (const key of Reflect.ownKeys(extension)) {
    if (!Object.prototype.propertyIsEnumerable.call(extension, key)) continue;
    if (Object.prototype.propertyIsEnumerable.call(output, key)) {
      throw new TypeError(`Guard output already contains key: ${String(key)}`);
    }
    output[key] = extension[key];
  }
  return output;
};

/**
 * Runs `output` only when `input` matches. `None` short-circuits successfully,
 * while failures and service requirements are preserved from both Guards.
 *
 * @remarks
 * ## Why
 * Sequential Guard composition must preserve ordinary non-match while unioning the typed error and service channels of both stages.
 *
 * ## Ownership and lifetime
 * Construction acquires no resources; each invocation runs the first Effect and only starts the second after `Some`.
 *
 * @example
 * ```ts
 * import { liftPredicate, pipe } from "@typed/guard"
 * const nonEmpty = pipe(liftPredicate((u: unknown): u is string => typeof u === "string"), liftPredicate((s) => s.length > 0))
 * ```
 *
 * @category Sequential composition
 * @since 1.0.0
 */
export const pipe: {
  <O, B, E2, R2>(
    output: GuardInput<O, B, E2, R2>,
  ): <I, R, E>(input: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>;
  <I, O, E, R, B, E2, R2>(
    input: GuardInput<I, O, E, R>,
    output: GuardInput<O, B, E2, R2>,
  ): Guard<I, B, E | E2, R | R2>;
} = dual(2, function flatMap<
  I,
  O,
  E,
  R,
  B,
  E2,
  R2,
>(input: GuardInput<I, O, E, R>, output: GuardInput<O, B, E2, R2>): Guard<I, B, E | E2, R | R2> {
  const g1 = getGuard(input);
  const g2 = getGuard(output);
  return (i) =>
    Effect.flatMapEager(
      invokeGuard(g1, i),
      Option.match({
        onNone: () => Effect.succeedNone,
        onSome: (value) => invokeGuard(g2, value),
      }),
    );
});

/**
 * Maps matched output with an Effect while preserving `None`.
 * @remarks
 * ## Why
 * Effectful mapping can add typed errors and services without changing non-match into failure.
 * ## Ownership and lifetime
 * Construction acquires no resources; the mapping Effect starts only after the source Guard produces `Some`.
 * @example
 * ```ts
 * import { liftPredicate, mapEffect } from "@typed/guard"
 * import { Effect } from "effect"
 * const length = mapEffect(liftPredicate((u: unknown): u is string => typeof u === "string"), (s) => Effect.succeed(s.length))
 * ```
 * @category Value transformations
 * @since 1.0.0
 */
export const mapEffect: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>;
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>,
  ): Guard<I, B, E | E2, R | R2>;
} = dual(2, function mapEffect<
  I,
  O,
  E,
  R,
  B,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (o: O) => Effect.Effect<B, E2, R2>): Guard<
  I,
  B,
  E | E2,
  R | R2
> {
  return pipe(guard, (o) => Effect.asSome(f(o)));
});

/**
 * Maps matched output synchronously while preserving non-match and Effect channels.
 * @remarks
 * ## Why
 * Pure output adaptation should not add errors or services and should never run for `None`.
 * ## Ownership and lifetime
 * Construction acquires no resources; the callback runs once for each `Some` during Effect execution.
 * @example
 * ```ts
 * import { liftPredicate, map } from "@typed/guard"
 * const length = map(liftPredicate((u: unknown): u is string => typeof u === "string"), (s) => s.length)
 * ```
 * @category Value transformations
 * @since 1.0.0
 */
export const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>;
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => B): Guard<I, B, E, R>;
} = dual(2, function map<I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => B): Guard<
  I,
  B,
  E,
  R
> {
  const g = getGuard(guard);
  return (i) => Effect.mapEager(invokeGuard(g, i), Option.map(f));
});

/**
 * Runs a synchronous or Effectful observation for each matched value and returns the value unchanged.
 * @remarks
 * ## Why
 * Observation composes without changing output, while Effect callbacks correctly contribute their errors and services.
 * ## Ownership and lifetime
 * Construction acquires no resources; callback lifetime is bounded by each matching Guard invocation.
 * @example
 * ```ts
 * import { liftPredicate, tap } from "@typed/guard"
 * const observed = tap(liftPredicate((u: unknown): u is string => typeof u === "string"), console.log)
 * ```
 * @category Effectful observation
 * @since 1.0.0
 */
export const tap: {
  <O>(f: (o: O) => void): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>;
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, R | R2>;
  <I, O, E, R>(guard: GuardInput<I, O, E, R>, f: (o: O) => void): Guard<I, O, E, R>;
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>,
  ): Guard<I, O, E | E2, R | R2>;
} = dual(2, function tap<
  I,
  O,
  E,
  R,
  B,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (o: O) => void | Effect.Effect<B, E2, R2>): Guard<
  I,
  O,
  E | E2,
  R | R2
> {
  return pipe(guard, (o) => {
    const x = f(o);
    if (Effect.isEffect(x)) return Effect.as(x, Option.some(o));
    return Effect.succeedSome(o);
  });
});

/**
 * Refines and maps a matched value with an Option-returning function.
 * @remarks
 * ## Why
 * `Option.none` provides a second ordinary non-match stage without introducing typed failure.
 * ## Ownership and lifetime
 * This combinator acquires no resources; the callback runs only for source matches.
 * @example
 * ```ts
 * import { filterMap, liftPredicate } from "@typed/guard"
 * import { Option } from "effect"
 * const parsed = filterMap(liftPredicate((u: unknown): u is string => typeof u === "string"), (s) => s ? Option.some(Number(s)) : Option.none())
 * ```
 * @category Input selection
 * @since 1.0.0
 */
export const filterMap: {
  <O, B>(
    f: (o: O) => Option.Option<B>,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>;
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R>;
} = dual(
  2,
  <I, O, E, R, B>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Option.Option<B>,
  ): Guard<I, B, E, R> => {
    const g = getGuard(guard);
    return (i) => Effect.mapEager(invokeGuard(g, i), Option.flatMap(f));
  },
);

/**
 * Keeps matched values that satisfy a predicate or refinement.
 * @remarks
 * ## Why
 * Predicate failure remains successful `None`, preserving Guard dispatch semantics and type refinement.
 * ## Ownership and lifetime
 * This combinator acquires no resources; the predicate runs only for source matches.
 * @example
 * ```ts
 * import { filter, liftPredicate } from "@typed/guard"
 * const positive = filter(liftPredicate((u: unknown): u is number => typeof u === "number"), (n) => n > 0)
 * ```
 * @category Input selection
 * @since 1.0.0
 */
export const filter: {
  <O, O2 extends O>(
    predicate: (o: O) => o is O2,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O2, E, R>;
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>;
  <I, O, E, R, O2 extends O>(
    guard: GuardInput<I, O, E, R>,
    predicate: (o: O) => o is O2,
  ): Guard<I, O2, E, R>;
  <I, O, E, R>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R>;
} = dual(
  2,
  <I, O, E, R, O2 extends O>(
    guard: GuardInput<I, O, E, R>,
    predicate: ((o: O) => o is O2) | ((o: O) => boolean),
  ): Guard<I, O2, E, R> => {
    const g = getGuard(guard);
    return (i) =>
      Effect.mapEager(invokeGuard(g, i), Option.filter(predicate)) as Effect.Effect<
        Option.Option<O2>,
        E,
        R
      >;
  },
);

/**
 * Runs candidates sequentially and returns the first match tagged with its key.
 * Candidates are snapshotted from own enumerable keys when `any` is called.
 * ECMAScript own-key order applies: integer-index strings, other strings, then
 * symbols.
 *
 * @remarks
 * ## Why
 * Ordered first-match dispatch turns independently composable Guards into a deterministic tagged union without treating `None` as failure.
 *
 * ## Ownership and lifetime
 * Construction snapshots own enumerable entries and acquires no resources; each run executes candidates sequentially until the first `Some`.
 *
 * @example
 * ```ts
 * import { any, liftPredicate } from "@typed/guard"
 * const classify = any({ text: liftPredicate((u: unknown): u is string => typeof u === "string") })
 * ```
 *
 * @category Alternative selection
 * @since 1.0.0
 */
export function any<const GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>>(
  guards: GS,
): Guard<AnyInput<GS>, AnyOutput<GS>, Guard.Error<GS[keyof GS]>, Guard.Services<GS[keyof GS]>> {
  const entries = Reflect.ownKeys(guards)
    .filter((key) => Object.prototype.propertyIsEnumerable.call(guards, key))
    .map((key) => [key, getGuard(guards[key as keyof GS])] as const);
  return (i: AnyInput<GS>) =>
    Effect.gen(function* () {
      for (const [_tag, guard] of entries) {
        const match = yield* invokeGuard(guard, i);
        if (Option.isSome(match)) {
          return Option.some({ _tag, value: match.value } as AnyOutput<GS>);
        }
      }
      return Option.none();
    });
}

/**
 * Computes the intersection of inputs accepted by an `any` Guard record.
 * @remarks
 * ## Why
 * Every candidate receives the same runtime value, so the input must satisfy all candidate input contracts.
 * ## Ownership and lifetime
 * This compile-time type acquires no resources and has no runtime lifetime.
 * @example
 * ```ts
 * import type { AnyInput, Guard } from "@typed/guard"
 * type Input = AnyInput<{ text: Guard<unknown, string>; count: Guard<unknown, number> }>
 * ```
 * @category Type utilities
 * @since 1.0.0
 */
export type AnyInput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> =
  UnionToIntersection<Guard.Input<GS[keyof GS]>>;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any
  ? R
  : never;

/**
 * Builds the tagged output union produced by `any`.
 * @remarks
 * ## Why
 * Preserving each record key in `_tag` lets downstream code narrow the winning Guard's value exhaustively.
 * ## Ownership and lifetime
 * This compile-time type acquires no resources and has no runtime lifetime.
 * @example
 * ```ts
 * import type { AnyOutput, Guard } from "@typed/guard"
 * type Output = AnyOutput<{ text: Guard<unknown, string>; count: Guard<unknown, number> }>
 * ```
 * @category Type utilities
 * @since 1.0.0
 */
export type AnyOutput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> = [
  {
    [K in keyof GS]: { readonly _tag: K; readonly value: Guard.Output<GS[K]> };
  }[keyof GS],
] extends [infer R]
  ? R
  : never;

/**
 * Builds a Guard from a predicate or refinement. The predicate is evaluated
 * only when the returned Effect runs. A thrown exception becomes an Effect
 * defect; use an effectful Guard when failure belongs in the typed error channel.
 *
 * @remarks
 * ## Why
 * Predicate lifting is the bridge from synchronous refinements into deferred Guard composition while preserving the `None` versus failure distinction.
 *
 * ## Ownership and lifetime
 * Construction acquires no resources; the predicate runs once per invocation when the returned Effect executes.
 *
 * @example
 * ```ts
 * import { liftPredicate } from "@typed/guard"
 * const string = liftPredicate((value: unknown): value is string => typeof value === "string")
 * ```
 *
 * @category Input selection
 * @since 1.0.0
 */
export function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, B>;
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A>;
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A> {
  return (a) => Effect.sync(() => (predicate(a) ? Option.some(a) : Option.none()));
}

/**
 * Recovers from the complete Effect Cause and lifts the recovery result into `Some`.
 * @remarks
 * ## Why
 * Cause-aware recovery can deliberately handle typed failures, defects, and interruption; `None` remains an unrecovered non-match.
 * ## Ownership and lifetime
 * Construction acquires no resources; recovery starts only when the source Effect fails and follows that invocation's lifetime.
 * @example
 * ```ts
 * import { catchCause } from "@typed/guard"
 * import type { Guard } from "@typed/guard"
 * import { Effect } from "effect"
 * const source: Guard<string, string, string> = (input) => input ? Effect.succeedSome(input) : Effect.fail("empty")
 * const recovered = catchCause(source, () => Effect.succeed("fallback"))
 * ```
 * @category Error recovery
 * @since 1.0.0
 */
export const catchCause: {
  <E, O2, E2, R2>(
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>,
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>;
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>,
  ): Guard<I, O | O2, E2, R | R2>;
} = dual(2, function catchCause<
  I,
  O,
  E,
  R,
  O2,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>): Guard<
  I,
  O | O2,
  E2,
  R | R2
> {
  const g = getGuard(guard);
  return (i) => Effect.catchCause(invokeGuard(g, i), (a) => Effect.asSome(f(a)));
});

/**
 * Recovers typed failures and lifts the recovery result into `Some`.
 * @remarks
 * ## Why
 * Typed recovery leaves defects and interruption untouched and does not confuse successful `None` with failure. The exported `catch` name is an alias of this declaration.
 * ## Ownership and lifetime
 * Construction acquires no resources; recovery starts only for typed failure during the source invocation.
 * @example
 * ```ts
 * import { catchAll } from "@typed/guard"
 * import type { Guard } from "@typed/guard"
 * import { Effect } from "effect"
 * const source: Guard<string, string, string> = (input) => input ? Effect.succeedSome(input) : Effect.fail("empty")
 * const recovered = catchAll(source, (error) => Effect.succeed(error.length))
 * ```
 * @category Error recovery
 * @since 1.0.0
 */
export const catchAll: {
  <E, O2, E2, R2>(
    f: (e: E) => Effect.Effect<O2, E2, R2>,
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>;
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: E) => Effect.Effect<O2, E2, R2>,
  ): Guard<I, O | O2, E2, R | R2>;
} = dual(2, function catchAll<
  I,
  O,
  E,
  R,
  O2,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (e: E) => Effect.Effect<O2, E2, R2>): Guard<
  I,
  O | O2,
  E2,
  R | R2
> {
  const g = getGuard(guard);
  return (i) => Effect.catchEager(invokeGuard(g, i), (a) => Effect.asSome(f(a)));
});

export { catchAll as catch };

/**
 * Recovers selected tagged typed failures and leaves unmatched tags in the error channel.
 * @remarks
 * ## Why
 * Tag-specific recovery preserves type-safe residual errors while lifting recovered output into `Some`; `None`, defects, and interruption are unchanged.
 * ## Ownership and lifetime
 * Construction acquires no resources; the handler runs only for matching tagged failures during an invocation.
 * @example
 * ```ts
 * import { catchTag } from "@typed/guard"
 * import type { Guard } from "@typed/guard"
 * import { Effect } from "effect"
 * type NotFound = { readonly _tag: "NotFound" }
 * const source: Guard<string, string, NotFound> = (input) => input ? Effect.succeedSome(input) : Effect.fail({ _tag: "NotFound" })
 * const recovered = catchTag(source, "NotFound", () => Effect.succeed("fallback"))
 * ```
 * @category Error recovery
 * @since 1.0.0
 */
export const catchTag: {
  <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, O2, E2, R2>(
    tag: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Effect.Effect<O2, E2, R2>,
  ): <I, O, R>(
    guard: GuardInput<I, O, E, R>,
  ) => Guard<
    I,
    O | O2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;

  <I, O, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Effect.Effect<O2, E2, R2>,
  ): Guard<
    I,
    O | O2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;
} = dual(
  3,
  <I, O, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Effect.Effect<O2, E2, R2>,
  ): Guard<
    I,
    O | O2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  > => {
    const g = getGuard(guard);
    return ((i: I) => Effect.catchTag(invokeGuard(g, i), tag, (e) => Effect.asSome(f(e)))) as Guard<
      I,
      O | O2,
      E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
      R | R2
    >;
  },
);

/**
 * Provides a Context or Layer to a Guard's Effect.
 * @remarks
 * ## Why
 * Provision removes supplied services from `R`; Layers may also contribute acquisition errors and their own requirements exactly as Effect does.
 * ## Ownership and lifetime
 * A Context acquires no resources here. Layer resources are acquired and released according to the Effect Scope that runs the Guard.
 * @example
 * ```ts
 * import { provide } from "@typed/guard"
 * import type { Guard } from "@typed/guard"
 * import { Context, Effect, Option } from "effect"
 * const Flag = Context.Service<{ readonly enabled: boolean }>("Flag")
 * const requiresFlag: Guard<boolean, boolean, never, Context.Service.Identifier<typeof Flag>> = (input) => Effect.map(Effect.service(Flag), ({ enabled }) => enabled && input ? Option.some(input) : Option.none())
 * const guard = provide(requiresFlag, Context.make(Flag, { enabled: true }))
 * ```
 * See [Effect services and Layers](https://effect.website/docs/requirements-management/layers/).
 * @category Services
 * @since 1.0.0
 */
export const provide: {
  <R2>(
    provided: Context.Context<R2>,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, R2>>;
  <R2, E2, R3>(
    provided: Layer.Layer<R2, E2, R3>,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, R2> | R3>;

  <I, O, E, R, R2>(
    guard: GuardInput<I, O, E, R>,
    provided: Context.Context<R2>,
  ): Guard<I, O, E, Exclude<R, R2>>;
  <I, O, E, R, R2, E2, R3>(
    guard: GuardInput<I, O, E, R>,
    provided: Layer.Layer<R2, E2, R3>,
  ): Guard<I, O, E | E2, Exclude<R, R2> | R3>;
} = dual(2, function provide<
  I,
  O,
  E,
  R,
  R2,
>(guard: GuardInput<I, O, E, R>, provided: Context.Context<R2>): Guard<I, O, E, Exclude<R, R2>> {
  const g = getGuard(guard);
  return (i) => Effect.provide(invokeGuard(g, i), provided);
});

/**
 * Provides one concrete service to a Guard.
 * @remarks
 * ## Why
 * Targeted service provision removes only the selected identifier from the Guard environment.
 * ## Ownership and lifetime
 * This combinator acquires no resources and reuses the supplied service for each invocation.
 * @example
 * ```ts
 * import { provideService } from "@typed/guard"
 * import type { Guard } from "@typed/guard"
 * import { Context, Effect, Option } from "effect"
 * const Flag = Context.Service<{ readonly enabled: boolean }>("Flag")
 * const requiresFlag: Guard<boolean, boolean, never, Context.Service.Identifier<typeof Flag>> = (input) => Effect.map(Effect.service(Flag), ({ enabled }) => enabled && input ? Option.some(input) : Option.none())
 * const guard = provideService(requiresFlag, Flag, { enabled: true })
 * ```
 * @category Services
 * @since 1.0.0
 */
export const provideService: {
  <Id, S>(
    tag: Context.Service<Id, S>,
    service: S,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, Id>>;
  <I, O, E, R, Id, S>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Service<Id, S>,
    service: S,
  ): Guard<I, O, E, Exclude<R, Id>>;
} = dual(3, function provideService<
  I,
  O,
  E,
  R,
  Id,
  S,
>(guard: GuardInput<I, O, E, R>, tag: Context.Service<Id, S>, service: S): Guard<
  I,
  O,
  E,
  Exclude<R, Id>
> {
  const g = getGuard(guard);
  return (i) => Effect.provideService(invokeGuard(g, i), tag, service);
});

/**
 * Provides a service produced by an Effect to a Guard.
 * @remarks
 * ## Why
 * Effectful provision makes acquisition errors and required services explicit in the composed Guard channels.
 * ## Ownership and lifetime
 * The service Effect runs for each Guard invocation and is interrupted with that invocation; scoped resources follow the surrounding Scope.
 * @example
 * ```ts
 * import { provideServiceEffect } from "@typed/guard"
 * import type { Guard } from "@typed/guard"
 * import { Context, Effect, Option } from "effect"
 * const Flag = Context.Service<{ readonly enabled: boolean }>("Flag")
 * const requiresFlag: Guard<boolean, boolean, never, Context.Service.Identifier<typeof Flag>> = (input) => Effect.map(Effect.service(Flag), ({ enabled }) => enabled && input ? Option.some(input) : Option.none())
 * const guard = provideServiceEffect(requiresFlag, Flag, Effect.succeed({ enabled: true }))
 * ```
 * @category Services
 * @since 1.0.0
 */
export const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: Context.Service<Id, S>,
    service: Effect.Effect<S, E2, R2>,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, Id> | R2>;
  <I, O, E, R, Id, S, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Service<Id, S>,
    service: Effect.Effect<S, E2, R2>,
  ): Guard<I, O, E | E2, Exclude<R, Id> | R2>;
} = dual(3, function provideServiceEffect<
  I,
  O,
  E,
  R,
  Id,
  S,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, tag: Context.Service<Id, S>, service: Effect.Effect<S, E2, R2>): Guard<
  I,
  O,
  E | E2,
  Exclude<R, Id> | R2
> {
  const g = getGuard(guard);
  return (i) => Effect.provideServiceEffect(invokeGuard(g, i), tag, service);
});

const parseOptions: ParseOptions = { errors: "all", onExcessProperty: "ignore" };

/**
 * Creates a Guard that decodes a schema's Encoded input to its Type.
 * @remarks
 * ## Why
 * Schema decoding reports all issues, ignores excess properties, retains `SchemaError` in the typed channel, and carries decoding services in `R`.
 * ## Ownership and lifetime
 * Construction acquires no resources; schema services and any scoped work follow each returned Effect invocation.
 * @example
 * ```ts
 * import { fromSchemaDecode } from "@typed/guard"
 * import { Schema } from "effect"
 * const number = fromSchemaDecode(Schema.NumberFromString)
 * ```
 * See [Effect Schema transformations](https://effect.website/docs/schema/transformations/).
 * @category Schema decoding and encoding
 * @since 1.0.0
 */
export function fromSchemaDecode<S extends Schema.Top>(
  schema: S,
): Guard<S["Encoded"], S["Type"], Schema.SchemaError, S["DecodingServices"]> {
  const decode_ = Schema.decodeEffect(schema);
  return (i: S["Encoded"]) => Effect.asSome(decode_(i, parseOptions));
}

/**
 * Creates a Guard that encodes a schema's Type to its Encoded representation.
 * @remarks
 * ## Why
 * Schema encoding is the reverse direction of decoding and keeps encoding services and `SchemaError` visible in the Guard type.
 * ## Ownership and lifetime
 * Construction acquires no resources; schema services and any scoped work follow each returned Effect invocation.
 * @example
 * ```ts
 * import { fromSchemaEncode } from "@typed/guard"
 * import { Schema } from "effect"
 * const encoded = fromSchemaEncode(Schema.NumberFromString)
 * ```
 * @category Schema decoding and encoding
 * @since 1.0.0
 */
export function fromSchemaEncode<S extends Schema.Top>(
  schema: S,
): Guard<S["Type"], S["Encoded"], Schema.SchemaError, S["EncodingServices"]> {
  const encode_ = Schema.encodeEffect(schema);
  return (a: S["Type"]) => Effect.asSome(encode_(a, parseOptions));
}

/**
 * Decodes each matched encoded value through an Effect Schema.
 * @remarks
 * ## Why
 * The composed Guard preserves source non-match and errors while adding schema failures and decoding service requirements.
 * ## Ownership and lifetime
 * Construction acquires no resources; decoding starts only for `Some` and follows that invocation's lifetime.
 * @example
 * ```ts
 * import { decode, liftPredicate } from "@typed/guard"
 * import { Schema } from "effect"
 * const number = decode(liftPredicate((u: unknown): u is string => typeof u === "string"), Schema.NumberFromString)
 * ```
 * @category Schema decoding and encoding
 * @since 1.0.0
 */
export const decode: {
  <S extends Schema.Top>(
    schema: S,
  ): <I, E = never, R = never>(
    guard: GuardInput<I, S["Encoded"], E, R>,
  ) => Guard<I, S["Type"], Schema.SchemaError | E, R | S["DecodingServices"]>;

  <I, E, R, S extends Schema.Top>(
    guard: GuardInput<I, S["Encoded"], E, R>,
    schema: S,
  ): Guard<I, S["Type"], Schema.SchemaError | E, R | S["DecodingServices"]>;
} = dual(2, function decode<
  I,
  E,
  R,
  S extends Schema.Top,
>(guard: GuardInput<I, S["Encoded"], E, R>, schema: S): Guard<
  I,
  S["Type"],
  Schema.SchemaError | E,
  R | S["DecodingServices"]
> {
  return pipe(guard, fromSchemaDecode(schema));
});

/**
 * Encodes each matched schema Type to its Encoded representation.
 * @remarks
 * ## Why
 * The composed Guard preserves source non-match and errors while adding schema failures and encoding service requirements.
 * ## Ownership and lifetime
 * Construction acquires no resources; encoding starts only for `Some` and follows that invocation's lifetime.
 * @example
 * ```ts
 * import { encode, liftPredicate } from "@typed/guard"
 * import { Schema } from "effect"
 * const text = encode(liftPredicate((u: unknown): u is number => typeof u === "number"), Schema.NumberFromString)
 * ```
 * @category Schema decoding and encoding
 * @since 1.0.0
 */
export const encode: {
  <S extends Schema.Top>(
    schema: S,
  ): <I, E = never, R = never>(
    guard: GuardInput<I, S["Type"], E, R>,
  ) => Guard<I, S["Encoded"], Schema.SchemaError | E, R | S["EncodingServices"]>;

  <I, E, R, S extends Schema.Top>(
    guard: GuardInput<I, S["Type"], E, R>,
    schema: S,
  ): Guard<I, S["Encoded"], Schema.SchemaError | E, R | S["EncodingServices"]>;
} = dual(2, function encode<
  I,
  E,
  R,
  S extends Schema.Top,
>(guard: GuardInput<I, S["Type"], E, R>, schema: S): Guard<
  I,
  S["Encoded"],
  Schema.SchemaError | E,
  R | S["EncodingServices"]
> {
  return pipe(guard, fromSchemaEncode(schema));
});

/**
 * Adds a fixed property to every matched record output.
 * @remarks
 * ## Why
 * Record construction does not mutate the input and rejects existing enumerable keys; it returns an unfrozen plain object containing own enumerable string and symbol properties while dropping prototypes and non-enumerables.
 * ## Ownership and lifetime
 * This pure combinator acquires no resources and creates a fresh plain object for every match.
 * @example
 * ```ts
 * import { bindTo, let as letGuard, liftPredicate } from "@typed/guard"
 * const named = letGuard(bindTo(liftPredicate(Boolean), "value"), "kind", "input")
 * ```
 * @category Record construction
 * @since 1.0.0
 */
const let_: {
  <K extends PropertyKey, B>(
    key: K,
    value: B,
  ): <G extends GuardInput<any, any, any, any>>(
    guard: G &
      RecordOutputConstraint<NoInfer<Guard.Output<G>>> &
      (K extends NoInfer<
        Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never
      >
        ? never
        : unknown),
  ) => Guard<Guard.Input<G>, Guard.Output<G> & { [k in K]: B }, Guard.Error<G>, Guard.Services<G>>;

  <G extends GuardInput<any, any, any, any>, K extends PropertyKey, B>(
    guard: G & RecordOutputConstraint<NoInfer<Guard.Output<G>>>,
    key: Exclude<
      K,
      NoInfer<Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never>
    >,
    value: B,
  ): Guard<Guard.Input<G>, Guard.Output<G> & { [k in K]: B }, Guard.Error<G>, Guard.Services<G>>;
} = dual(3, function attachProperty<
  I,
  O extends object,
  E,
  R,
  K extends PropertyKey,
  B,
>(guard: GuardInput<I, O, E, R>, key: K, value: B): Guard<I, O & { [k in K]: B }, E, R> {
  return map(
    guard,
    (a) => extendEnumerableRecord(assertObjectRecord(a), key, value) as O & { [k in K]: B },
  );
});

export {
  /**
   * Adds a fixed property to every matched object output. The key must not
   * already exist; use `bindTo` first when the prior output is not an object.
   *
   * This alias shares the canonical documentation and behavior of `let_`.
   *
   * @since 1.0.0
   */
  let_ as let,
};

/**
 * Adds a readonly `_tag` to every matched object output. The output must not
 * already have an `_tag` property.
 *
 * @remarks
 * ## Why
 * A typed discriminant turns matched record outputs into exhaustively narrowable tagged values while rejecting key collisions.
 *
 * ## Ownership and lifetime
 * This pure combinator acquires no resources and creates a fresh plain object for every match.
 *
 * @example
 * ```ts
 * import { addTag, bindTo, liftPredicate } from "@typed/guard"
 * const tagged = addTag(bindTo(liftPredicate(Boolean), "value"), "Input")
 * ```
 *
 * @category Record construction
 * @since 1.0.0
 */
export const addTag: {
  <B>(
    value: B,
  ): <G extends GuardInput<any, any, any, any>>(
    guard: G &
      RecordOutputConstraint<NoInfer<Guard.Output<G>>> &
      ("_tag" extends NoInfer<
        Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never
      >
        ? never
        : unknown),
  ) => Guard<
    Guard.Input<G>,
    Guard.Output<G> & { readonly _tag: B },
    Guard.Error<G>,
    Guard.Services<G>
  >;

  <G extends GuardInput<any, any, any, any>, B>(
    guard: G &
      RecordOutputConstraint<NoInfer<Guard.Output<G>>> &
      ("_tag" extends NoInfer<
        Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never
      >
        ? never
        : unknown),
    value: B,
  ): Guard<
    Guard.Input<G>,
    Guard.Output<G> & { readonly _tag: B },
    Guard.Error<G>,
    Guard.Services<G>
  >;
} = dual(2, function attachProperty<
  I,
  O extends object,
  E,
  R,
  B,
>(guard: GuardInput<I, O, E, R>, value: B): Guard<I, O & { readonly _tag: B }, E, R> {
  return map(
    guard,
    (a) => extendEnumerableRecord(assertObjectRecord(a), "_tag", value) as O & { readonly _tag: B },
  );
});

/**
 * Wraps any matched output in a new object under `key`. This is the explicit
 * transition from an arbitrary output to the record-building workflow.
 *
 * @remarks
 * ## Why
 * Explicit wrapping makes arbitrary values safe for record combinators without assuming their runtime shape.
 *
 * ## Ownership and lifetime
 * This pure combinator acquires no resources and creates a fresh plain object for every match.
 *
 * @example
 * ```ts
 * import { bindTo, liftPredicate } from "@typed/guard"
 * const named = bindTo(liftPredicate(Boolean), "value")
 * ```
 *
 * @category Record construction
 * @since 1.0.0
 */
export const bindTo: {
  <K extends PropertyKey>(
    key: K,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, { [k in K]: O }, E, R>;
  <I, O, E, R, K extends PropertyKey>(
    guard: GuardInput<I, O, E, R>,
    key: K,
  ): Guard<I, { [k in K]: O }, E, R>;
} = dual(
  2,
  <I, O, E, R, K extends PropertyKey>(
    guard: GuardInput<I, O, E, R>,
    key: K,
  ): Guard<I, { [k in K]: O }, E, R> => map(guard, (a) => ({ [key]: a }) as { [k in K]: O }),
);

/**
 * Runs `f` on a matched object and adds its matched value under a new key. The
 * key must not already exist. Enumerable getters and proxy traps may execute
 * during the object spread.
 *
 * @remarks
 * ## Why
 * Dependent record construction runs the second Guard only after the base matches, preserves `None`, and unions both error and service channels.
 *
 * ## Ownership and lifetime
 * Construction acquires no resources; each successful bind creates a fresh plain object and the dependent Effect follows the invocation lifetime.
 *
 * @example
 * ```ts
 * import { bind, bindTo, liftPredicate, map } from "@typed/guard"
 * const base = bindTo(liftPredicate((u: unknown): u is string => typeof u === "string"), "text")
 * const nonEmptyLength = map(liftPredicate((record: { readonly text: string }) => record.text.length > 0), (record) => record.text.length)
 * const sized = bind(base, "length", nonEmptyLength)
 * ```
 *
 * @category Record construction
 * @since 1.0.0
 */
export const bind: {
  <O extends object, K extends PropertyKey, B, E2, R2>(
    key: K,
    f: GuardInput<O, B, E2, R2>,
  ): <G extends GuardInput<any, O, any, any>>(
    guard: G &
      RecordOutputConstraint<NoInfer<Guard.Output<G>>> &
      (K extends NoInfer<
        Guard.Output<G> extends infer A ? (A extends unknown ? keyof A : never) : never
      >
        ? never
        : unknown),
  ) => Guard<
    Guard.Input<G>,
    Guard.Output<G> & { [k in K]: B },
    Guard.Error<G> | E2,
    Guard.Services<G> | R2
  >;

  <G extends GuardInput<any, any, any, any>, K extends PropertyKey, B, E2, R2>(
    guard: G & RecordOutputConstraint<NoInfer<Guard.Output<G>>>,
    key: Exclude<
      K,
      NoInfer<Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never>
    >,
    f: GuardInput<NoInfer<Guard.Output<G>>, B, E2, R2>,
  ): Guard<
    Guard.Input<G>,
    Guard.Output<G> & { [k in K]: B },
    Guard.Error<G> | E2,
    Guard.Services<G> | R2
  >;
} = dual(3, function bind<
  I,
  O extends object,
  E,
  R,
  K extends PropertyKey,
  B,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, key: K, f: GuardInput<O, B, E2, R2>): Guard<
  I,
  O & { [k in K]: B },
  E | E2,
  R | R2
> {
  const f_ = bindTo(f, key);
  return pipe(guard, (o) =>
    Effect.mapEager(
      invokeGuard(f_, o),
      Option.map(
        (b) =>
          mergeEnumerableRecords(assertObjectRecord(o), b as Record<PropertyKey, unknown>) as O & {
            [k in K]: B;
          },
      ),
    ),
  );
});

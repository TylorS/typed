import type * as Arr from "effect/Array";
import * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import * as Result from "effect/Result";
import type { ExcludeTag, ExtractTag, NoInfer, Tags } from "effect/Types";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

const hasTag = (u: unknown): u is { readonly _tag: string } =>
  typeof u === "object" &&
  u !== null &&
  "_tag" in u &&
  typeof (u as Record<string, unknown>)["_tag"] === "string";

const matchesTag = <E, K extends string>(
  tag: K | Arr.NonEmptyReadonlyArray<K>,
  error: E,
): error is ExtractTag<E, K> => {
  if (!hasTag(error)) return false;
  if (typeof tag === "string") return error._tag === tag;
  return tag.some((t) => t === error._tag);
};

/**
 * Recovers from the first typed failure of an Fx by running a fallback Fx.
 *
 * @remarks
 * ## Why
 *
 * Typed failures are part of an Fx's public error channel, so callers often
 * need to replace a failed producer based on its first typed failure. This is
 * the push-stream counterpart of Effect's typed recovery.
 *
 * ## Ownership and lifetime
 *
 * The source runs until it reports a Cause containing a `Fail`. The first typed
 * failure starts exactly one fallback and the entire original Cause is replaced,
 * including any defects or interrupts composed beside that Fail. A Cause with
 * no Fail passes through unchanged. Source values already delivered remain
 * delivered. The fallback's services become requirements of the returned Fx,
 * and external interruption stops whichever run is active.
 *
 * @example
 * ```ts
 * import { catch as recover } from "@typed/fx/Fx"
 * import { fail, succeed } from "@typed/fx/Fx"
 *
 * const resilient = recover(fail("offline"), (error) => succeed(error.length))
 * ```
 *
 * @example Recovering a Fail discards its complete composite Cause
 * ```ts
 * import { Cause } from "effect"
 * import { catch as recover } from "@typed/fx/Fx"
 * import { failCause, succeed } from "@typed/fx/Fx"
 *
 * const composite = Cause.combine(Cause.fail("offline"), Cause.die("socket defect"))
 * const recovered = recover(failCause(composite), () => succeed("cached"))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catch_: {
  <E, A2, E2, R2>(f: (e: E) => Fx<A2, E2, R2>): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E2, R | R2>;

  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, f: (e: E) => Fx<A2, E2, R2>): Fx<A | A2, E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, f: (e: E) => Fx<A2, E2, R2>): Fx<A | A2, E2, R | R2> =>
    make<A | A2, E2, R | R2>((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          }
          return f(result.success.error).run(sink);
        }, sink.onSuccess),
      ),
    ),
);

export { catch_ as catch };

/**
 * Uses the Effect-style `catchAll` name for {@link catch}.
 *
 * @remarks
 * ## Why
 *
 * The alias lets Effect users apply the same typed-failure recovery vocabulary
 * to Fx without introducing different runtime behavior.
 *
 * ## Ownership and lifetime
 *
 * It has exactly the source/fallback switching, failure, service, and
 * interruption semantics of {@link catch}; it allocates no wrapper resource
 * beyond that combinator.
 *
 * @example
 * ```ts
 * import { catchAll } from "@typed/fx/Fx"
 * import { fail, succeed } from "@typed/fx/Fx"
 *
 * const recovered = catchAll(fail("missing"), () => succeed("default"))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catchAll = catch_;

/**
 * Recovers from any failure cause by running a fallback Fx.
 *
 * @remarks
 * ## Why
 *
 * A full `Cause` retains typed failures, defects, interruption, and composed
 * causes. Handling that structure explicitly is necessary at boundaries that
 * must translate every termination mode rather than only expected errors.
 *
 * ## Ownership and lifetime
 *
 * The handler runs once after the source reports a cause and its returned Fx
 * continues in the same subscription. It receives the cause unchanged. Values
 * emitted before failure are not replayed, and the fallback's errors and
 * services replace the recovered source error and join its requirements.
 * Because interruption is catchable here, use this only when intentionally
 * translating interruption rather than for ordinary typed recovery.
 *
 * @example
 * ```ts
 * import { Cause } from "effect"
 * import { catchCause } from "@typed/fx/Fx"
 * import { failCause, succeed } from "@typed/fx/Fx"
 *
 * const reported = catchCause(failCause(Cause.die("boom")), (cause) =>
 *   succeed(Cause.pretty(cause))
 * )
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catchCause: {
  <E, A2, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E2, R | R2>;

  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E2, R | R2> =>
    make<A | A2, E2, R | R2>((sink) =>
      self.run(makeSink((cause) => f(cause).run(sink), sink.onSuccess)),
    ),
);

/**
 * Recovers selected tagged typed failures by running a fallback Fx.
 *
 * @remarks
 * ## Why
 *
 * Tagged error unions are idiomatic Effect APIs. Selecting one or more tags
 * narrows the handler input and removes only those variants from the returned
 * error channel, preserving the rest for later composition.
 *
 * ## Ownership and lifetime
 *
 * The source owns the subscription until its Cause contains a Fail whose tag
 * matches. That first matching Fail starts one handler Fx and replaces the
 * entire original Cause, including any defects or interrupts composed with it.
 * A Cause with no Fail, or a first Fail with another tag, passes through intact.
 * The fallback is lazy and contributes its errors and services to the result.
 *
 * @example
 * ```ts
 * import { catchTag } from "@typed/fx/Fx"
 * import { fail, succeed } from "@typed/fx/Fx"
 *
 * type Missing = { readonly _tag: "Missing"; readonly id: string }
 * const source = fail<Missing>({ _tag: "Missing", id: "42" })
 * const recovered = catchTag(source, "Missing", ({ id }) => succeed(`missing:${id}`))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catchTag: {
  <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, A2, E2, R2>(
    k: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx<A2, E2, R2>,
  ): <A, R>(
    self: Fx<A, E, R>,
  ) => Fx<
    A | A2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;

  <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, A2, E2, R2>(
    self: Fx<A, E, R>,
    k: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx<A2, E2, R2>,
  ): Fx<
    A | A2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;
} = dual(
  3,
  <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, A2, E2, R2>(
    self: Fx<A, E, R>,
    k: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx<A2, E2, R2>,
  ): Fx<
    A | A2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  > =>
    make<
      A | A2,
      E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
      R | R2
    >((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          } else if (matchesTag(k, result.success.error)) {
            return f(
              result.success.error as ExtractTag<
                E,
                K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
              >,
            ).run(sink);
          } else {
            return sink.onFailure(
              cause as Cause.Cause<
                E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>
              >,
            );
          }
        }, sink.onSuccess),
      ),
    ),
);

/**
 * Recovers a typed failure only when a predicate accepts it.
 *
 * @remarks
 * ## Why
 *
 * Some typed errors are distinguished by values rather than tags. Predicate
 * recovery handles that subset while retaining `E` in the result because a
 * rejected error can still escape.
 *
 * ## Ownership and lifetime
 *
 * The predicate is evaluated on the first Fail found anywhere in the source
 * Cause. A match starts one lazy fallback and replaces that entire Cause,
 * including any defects or interrupts composed with the Fail. A rejection, or
 * a Cause containing no Fail, forwards the original Cause unchanged. The
 * fallback contributes its errors and services and shares the subscription.
 *
 * @example
 * ```ts
 * import { catchIf } from "@typed/fx/Fx"
 * import { fail, succeed } from "@typed/fx/Fx"
 *
 * const recovered = catchIf(fail(404), (status) => status === 404, () => succeed("missing"))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catchIf: {
  <E, A2, E2, R2>(
    predicate: (e: E) => boolean,
    f: (e: E) => Fx<A2, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;

  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (e: E) => boolean,
    f: (e: E) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (e: E) => boolean,
    f: (e: E) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2> =>
    make<A | A2, E | E2, R | R2>((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          }
          const error = result.success.error;
          if (predicate(error)) {
            return f(error).run(sink);
          }
          return sink.onFailure(cause);
        }, sink.onSuccess),
      ),
    ),
);

/**
 * Recovers a failure cause only when a predicate accepts the complete cause.
 *
 * @remarks
 * ## Why
 *
 * Cause-level predicates can distinguish defects, interruption, sequential or
 * parallel cause structure that a typed-error predicate cannot observe.
 *
 * ## Ownership and lifetime
 *
 * The predicate receives the source cause unchanged. A match starts one lazy
 * fallback in the same subscription; otherwise the original cause propagates.
 * The fallback's requirements and errors are added, prior source values stay
 * delivered, and interrupting the returned Fx interrupts its active run.
 *
 * @example
 * ```ts
 * import { Cause } from "effect"
 * import { catchCauseIf } from "@typed/fx/Fx"
 * import { failCause, succeed } from "@typed/fx/Fx"
 *
 * const recovered = catchCauseIf(
 *   failCause(Cause.die("bad decoder")),
 *   Cause.hasDies,
 *   () => succeed("reported")
 * )
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catchCauseIf: {
  <E, A2, E2, R2>(
    predicate: (cause: Cause.Cause<E>) => boolean,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;

  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (cause: Cause.Cause<E>) => boolean,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (cause: Cause.Cause<E>) => boolean,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2> =>
    make<A | A2, E | E2, R | R2>((sink) =>
      self.run(
        makeSink(
          (cause) => (predicate(cause) ? f(cause).run(sink) : sink.onFailure(cause)),
          sink.onSuccess,
        ),
      ),
    ),
);

type TaggedCase<E> = {
  [K in Extract<E, { _tag: string }>["_tag"]]+?: (
    error: Extract<E, { _tag: K }>,
  ) => Fx<unknown, unknown, unknown>;
};

type CaseSuccess<T> = T extends (error: never) => Fx<infer A, infer _E, infer _R> ? A : never;
type CaseError<T> = T extends (error: never) => Fx<infer _A, infer E, infer _R> ? E : never;
type CaseServices<T> = T extends (error: never) => Fx<infer _A, infer _E, infer R> ? R : never;

/**
 * Recovers several tagged typed-error variants with one handler table.
 *
 * @remarks
 * ## Why
 *
 * A handler table keeps multi-variant recovery exhaustive and preserves the
 * precise success, error, and service unions produced by each selected case.
 * Unlisted variants remain visible in the returned error channel.
 *
 * ## Ownership and lifetime
 *
 * The first Fail found anywhere in the source Cause is inspected. A listed tag
 * starts exactly one handler Fx and replaces the entire original Cause,
 * including any defects or interrupts composed with that Fail. An untagged or
 * unlisted first Fail, or a Cause with no Fail, propagates intact. Handlers are
 * lazy and contribute their individual errors and service requirements.
 *
 * @example
 * ```ts
 * import { catchTags } from "@typed/fx/Fx"
 * import { fail, succeed } from "@typed/fx/Fx"
 *
 * type Failure =
 *   | { readonly _tag: "Missing"; readonly id: string }
 *   | { readonly _tag: "Forbidden" }
 * const source = fail<Failure>({ _tag: "Missing", id: "42" })
 * const recovered = catchTags(source, {
 *   Missing: ({ id }) => succeed(`missing:${id}`),
 *   Forbidden: () => succeed("forbidden")
 * })
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const catchTags: {
  <E, Cases extends TaggedCase<E>>(
    cases: Cases,
  ): <A, R>(
    self: Fx<A, E, R>,
  ) => Fx<
    A | { [K in keyof Cases]: CaseSuccess<Cases[K]> }[keyof Cases],
    Exclude<E, { _tag: keyof Cases }> | { [K in keyof Cases]: CaseError<Cases[K]> }[keyof Cases],
    R | { [K in keyof Cases]: CaseServices<Cases[K]> }[keyof Cases]
  >;

  <A, E, R, Cases extends TaggedCase<E>>(
    self: Fx<A, E, R>,
    cases: Cases,
  ): Fx<
    A | { [K in keyof Cases]: CaseSuccess<Cases[K]> }[keyof Cases],
    Exclude<E, { _tag: keyof Cases }> | { [K in keyof Cases]: CaseError<Cases[K]> }[keyof Cases],
    R | { [K in keyof Cases]: CaseServices<Cases[K]> }[keyof Cases]
  >;
} = dual(
  2,
  <A, E, R, Cases extends TaggedCase<E>>(
    self: Fx<A, E, R>,
    cases: Cases,
  ): Fx<
    A | { [K in keyof Cases]: CaseSuccess<Cases[K]> }[keyof Cases],
    Exclude<E, { _tag: keyof Cases }> | { [K in keyof Cases]: CaseError<Cases[K]> }[keyof Cases],
    R | { [K in keyof Cases]: CaseServices<Cases[K]> }[keyof Cases]
  > =>
    make<
      A | { [K in keyof Cases]: CaseSuccess<Cases[K]> }[keyof Cases],
      Exclude<E, { _tag: keyof Cases }> | { [K in keyof Cases]: CaseError<Cases[K]> }[keyof Cases],
      R | { [K in keyof Cases]: CaseServices<Cases[K]> }[keyof Cases]
    >(
      (sink) =>
        self.run(
          makeSink((cause) => {
            const result = Cause.findFail(cause);
            if (Result.isFailure(result)) {
              return sink.onFailure(result.failure);
            }
            const error = result.success.error as E;
            if (!hasTag(error)) {
              return sink.onFailure(
                cause as Cause.Cause<
                  | Exclude<E, { _tag: keyof Cases }>
                  | { [K in keyof Cases]: CaseError<Cases[K]> }[keyof Cases]
                >,
              );
            }
            const tag = (error as { _tag: string })._tag;
            const handler = (
              cases as Record<string, (e: unknown) => Fx<unknown, unknown, unknown>>
            )[tag];
            if (handler !== undefined) {
              return handler(error).run(
                sink as import("../../Sink/Sink.js").Sink<
                  unknown,
                  unknown,
                  import("../../Sink/Sink.js").Services<typeof sink>
                >,
              );
            }
            return sink.onFailure(
              cause as Cause.Cause<
                | Exclude<E, { _tag: keyof Cases }>
                | { [K in keyof Cases]: CaseError<Cases[K]> }[keyof Cases]
              >,
            );
          }, sink.onSuccess),
        ) as import("effect/Effect").Effect<
          unknown,
          never,
          | R
          | { [K in keyof Cases]: CaseServices<Cases[K]> }[keyof Cases]
          | import("../../Sink/Sink.js").Services<typeof sink>
        >,
    ),
);

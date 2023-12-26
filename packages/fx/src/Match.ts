/**
 * @since 1.18.0
 */

import type { Scope } from "effect"
import { Effect, Exit } from "effect"
import * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import { identity } from "effect/Function"
import * as Option from "effect/Option"
import { isNonEmptyReadonlyArray, reduce } from "effect/ReadonlyArray"
import * as Fx from "./Fx.js"
import type { Guard } from "./Guard.js"
import { FxBase } from "./internal/protos.js"
import * as RefSubject from "./RefSubject.js"
import type { Sink } from "./Sink.js"

/**
 * @since 1.18.0
 */
export const MatcherTypeId: unique symbol = Symbol.for("@typed/fx/Matcher")
/**
 * @since 1.18.0
 */
export type MatcherTypeId = typeof MatcherTypeId

/**
 * @since 1.18.0
 */
export interface TypeMatcher<R, E, I, O> {
  readonly _tag: "TypeMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<R, E, I, O>

  readonly when: <R2 = never, E2 = never, A = never, R3 = never, E3 = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R3, E3, B>
  ) => TypeMatcher<R | R2 | R3, E | E2 | E3, I, O | B>

  readonly to: <R2 = never, E2 = never, A = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: B
  ) => TypeMatcher<R | R2, E | E2, I, O | B>

  readonly run: <R2 = never, E2 = never>(
    input: Fx.Fx<R2, E2, I>
  ) => Fx.Fx<R | R2 | Scope.Scope, E | E2, Option.Option<O>>
}

/**
 * @since 1.18.0
 */
export interface ValueMatcher<R, E, I, O> extends Fx.Fx<R | Scope.Scope, E, Option.Option<O>> {
  readonly _tag: "ValueMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<R, E, I, O>

  readonly value: Fx.Fx<R, E, I>

  readonly when: <R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R3, E3, B>
  ) => ValueMatcher<R | R2 | R3, E | E2 | E3, I, O | B>

  readonly to: <R2, E2, A, B>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: B
  ) => ValueMatcher<R | R2, E | E2, I, O | B>

  readonly getOrElse: <R2 = never, E2 = never, B = never>(
    f: () => Fx.Fx<R2, E2, B>
  ) => Fx.Fx<R | R2 | Scope.Scope, E | E2, O | B>
}

/**
 * @since 1.18.0
 */
export namespace Matcher {
  /**
   * @since 1.18.0
   */
  export interface Variance<R, E, I, O> {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _I: (_: I) => unknown
    readonly _O: (_: never) => O
  }
}

/**
 * @since 1.18.0
 */
export const type = <I>(): TypeMatcher<never, never, I, never> =>
  new TypeMatcherImpl<never, never, I, never>(Chunk.empty())

/**
 * @since 1.18.0
 */
export const value = <R, E, I>(input: Fx.Fx<R, E, I>): ValueMatcher<R, E, I, never> =>
  new ValueMatcherImpl(input, type<I>())

// Internals

const variance: Matcher.Variance<any, any, any, any> = {
  _R: identity,
  _E: identity,
  _I: identity,
  _O: identity
}

class When<R, E, I, A, O> {
  constructor(
    readonly guard: (input: I) => Effect.Effect<R, E, Option.Option<A>>,
    readonly onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R, E, O>
  ) {}
}

class TypeMatcherImpl<R, E, I, O> implements TypeMatcher<R, E, I, O> {
  readonly _tag = "TypeMatcher"
  readonly [MatcherTypeId]: TypeMatcher<R, E, I, O>[MatcherTypeId] = variance as any

  constructor(readonly cases: Chunk.Chunk<When<any, any, I, any, any>>) {
    this.when = this.when.bind(this)
    this.run = this.run.bind(this)
  }

  when<R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R3, E3, B>
  ): TypeMatcher<R | R2 | R3, E | E2 | E3, I, O | B> {
    return new TypeMatcherImpl<R | R2 | R3, E | E2 | E3, I, O | B>(
      Chunk.append(this.cases, new When<R2 | R3, E2 | E3, I, A, B>(getGuard(guard), onMatch))
    )
  }

  to<R2, E2, A, B>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: B
  ): TypeMatcher<R | R2, E | E2, I, O | B> {
    return this.when(guard, () => Fx.succeed(onMatch))
  }

  run<R2, E2>(input: Fx.Fx<R2, E2, I>): Fx.Fx<R | R2, E | E2, Option.Option<O>> {
    const { cases } = this

    return Fx.suspend(() => {
      const refSubjects = new WeakMap<When<any, any, I, any, any>, RefSubject.RefSubject<never, never, any>>()
      const getRefSubject = (_case: When<any, any, I, any, any>, value: any) =>
        Effect.gen(function*(_) {
          let refSubject = refSubjects.get(_case)

          if (refSubject) {
            yield* _(RefSubject.set(refSubject, value))
          } else {
            refSubject = yield* _(RefSubject.of(value))
          }

          return refSubject
        })

      let previous: When<any, any, I, any, any>

      return Fx.skipRepeats(input).pipe(
        Fx.switchMapEffect((input) =>
          Effect.gen(function*(_) {
            // Allow failures to be accumulated, such that errors do not break the overall match
            // and additional matchers can be attempted against first
            const causes: Array<Cause.Cause<E>> = []

            // If there's a previous match, attempt it first
            if (previous) {
              const matchedExit = yield* _(previous.guard(input), Effect.exit)

              if (Exit.isSuccess(matchedExit)) {
                const matched = matchedExit.value

                if (Option.isSome(matched)) {
                  const refSubject = yield* _(getRefSubject(previous, matched.value))

                  return Option.some([previous, refSubject] as const)
                }
              } else {
                causes.push(matchedExit.cause)
              }
            }

            for (const _case of cases) {
              // Don't test this case twice
              if (_case === previous) continue

              const matchedExit = yield* _(_case.guard(input), Effect.exit)

              if (Exit.isSuccess(matchedExit)) {
                const matched = matchedExit.value

                if (Option.isSome(matched)) {
                  const refSubject = yield* _(getRefSubject(_case, matched.value))
                  previous = _case

                  return Option.some([_case, refSubject] as const)
                }
              } else {
                causes.push(matchedExit.cause)
              }
            }

            if (isNonEmptyReadonlyArray(causes)) {
              const [first, ...rest] = causes

              return yield* _(Effect.failCause(reduce(rest, first, Cause.sequential)))
            } else {
              return Option.none()
            }
          })
        ),
        // Avoid restarting based on the Case that was matched to keep a peristent
        // workflow for matcher that has its input values change
        Fx.skipRepeatsWith(Option.getEquivalence(([a], [b]) => a === b)),
        Fx.switchMap(
          Option.match({
            onNone: () => Fx.succeed(Option.none()),
            onSome: ([when, ref]) => {
              return Fx.map(when.onMatch(ref), Option.some)
            }
          })
        )
      )
    })
  }
}

class ValueMatcherImpl<R, E, I, O> extends FxBase<R | Scope.Scope, E, Option.Option<O>>
  implements ValueMatcher<R, E, I, O>
{
  readonly _tag = "ValueMatcher"
  readonly [MatcherTypeId]: ValueMatcher<R, E, I, O>[MatcherTypeId] = variance

  constructor(readonly value: Fx.Fx<R, E, I>, readonly matcher: TypeMatcher<R, E, I, O>) {
    super()
    this.when = this.when.bind(this)
    this.to = this.to.bind(this)
    this.getOrElse = this.getOrElse.bind(this)
  }

  run<R2>(sink: Sink<R2, E, Option.Option<O>>) {
    return this.matcher.run(this.value).run(sink)
  }

  when<R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R3, E3, B>
  ): ValueMatcher<R | R2 | R3, E | E2 | E3, I, O | B> {
    return new ValueMatcherImpl<R | R2 | R3, E | E2 | E3, I, O | B>(
      this.value,
      this.matcher.when(guard, onMatch)
    )
  }

  to<R2, E2, A, B>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: B
  ): ValueMatcher<R | R2, E | E2, I, O | B> {
    return this.when(guard, () => Fx.succeed(onMatch))
  }

  getOrElse: ValueMatcher<R, E, I, O>["getOrElse"] = (f) => Fx.getOrElse(this.matcher.run(this.value), f)
}

/**
 * @since 1.18.0
 */
export interface AsGuard<I, R, E, A> {
  readonly asGuard: () => Guard<I, R, E, A>
}

function getGuard<I, R, E, A>(guard: Guard<I, R, E, A> | AsGuard<I, R, E, A>): Guard<I, R, E, A> {
  if (typeof guard === "function") return guard
  return guard.asGuard()
}

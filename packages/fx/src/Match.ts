import { RefSubject } from "@typed/fx"
import * as Fx from "@typed/fx/Fx"
import { Effect, Exit } from "effect"
import * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import { identity } from "effect/Function"
import * as Option from "effect/Option"
import { isNonEmptyReadonlyArray, reduce } from "effect/ReadonlyArray"

export const MatcherTypeId: unique symbol = Symbol.for("@typed/fx/Matcher")
export type MatcherTypeId = typeof MatcherTypeId

export interface TypeMatcher<R, E, I, O> {
  readonly _tag: "TypeMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<R, E, I, O>

  readonly when: <R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: (input: I) => Effect.Effect<R2, E2, Option.Option<A>>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.FxInput<R3, E3, B>
  ) => TypeMatcher<R | R2 | R3, E | E2 | E3, I, O | B>

  readonly run: <R2 = never, E2 = never>(input: Fx.FxInput<R2, E2, I>) => Fx.Fx<R | R2, E | E2, Option.Option<O>>
}

export interface ValueMatcher<R, E, I, O> {
  readonly _tag: "ValueMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<R, E, I, O>

  readonly value: Fx.Fx<R, E, I>

  readonly when: <R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: (input: I) => Effect.Effect<R2, E2, Option.Option<A>>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.FxInput<R3, E3, B>
  ) => ValueMatcher<R | R2 | R3, E | E2 | E3, I, O | B>

  readonly run: Fx.Fx<R, E, Option.Option<O>>
}

export namespace Matcher {
  export interface Variance<R, E, I, O> {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _I: (_: I) => unknown
    readonly _O: (_: never) => O
  }
}

export const type = <I>(): TypeMatcher<never, never, I, never> =>
  new TypeMatcherImpl<never, never, I, never>(Chunk.empty())

export const value = <R, E, I>(input: Fx.FxInput<R, E, I>): ValueMatcher<R, E, I, never> =>
  new ValueMatcherImpl(Fx.from(input), type<I>())

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
    readonly onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.FxInput<R, E, O>
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
    guard: (input: I) => Effect.Effect<R2, E2, Option.Option<A>>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.FxInput<R3, E3, B>
  ): TypeMatcher<R | R2 | R3, E | E2 | E3, I, O | B> {
    return new TypeMatcherImpl<R | R2 | R3, E | E2 | E3, I, O | B>(
      Chunk.append(this.cases, new When<R2 | R3, E2 | E3, I, A, B>(guard, onMatch))
    )
  }

  run<R2, E2>(input: Fx.FxInput<R2, E2, I>): Fx.Fx<R | R2, E | E2, Option.Option<O>> {
    const { cases } = this

    return Fx.suspend(() => {
      const refSubjects = new WeakMap<When<any, any, I, any, any>, RefSubject.RefSubject<never, never, any>>()

      const getRefSubject = (_case: When<any, any, I, any, any>, value: any) =>
        Effect.gen(function*(_) {
          let refSubject = refSubjects.get(_case)

          if (refSubject) {
            yield* _(refSubject.set(value))
          } else {
            refSubject = yield* _(RefSubject.of(value))
          }

          return refSubject
        })

      let previous: When<any, any, I, any, any>

      return Fx.from(input).pipe(
        Fx.switchMap((input) =>
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
            onNone: () => Effect.succeedNone,
            onSome: ([when, ref]) => Fx.map(Fx.from(when.onMatch(ref)), Option.some)
          })
        )
      )
    })
  }
}

class ValueMatcherImpl<R, E, I, O> implements ValueMatcher<R, E, I, O> {
  readonly _tag = "ValueMatcher"
  readonly [MatcherTypeId]: ValueMatcher<R, E, I, O>[MatcherTypeId] = variance

  constructor(readonly value: Fx.Fx<R, E, I>, readonly matcher: TypeMatcher<R, E, I, O>) {
    this.when = this.when.bind(this)
  }

  when<R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: (input: I) => Effect.Effect<R2, E2, Option.Option<A>>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.FxInput<R3, E3, B>
  ): ValueMatcher<R | R2 | R3, E | E2 | E3, I, O | B> {
    return new ValueMatcherImpl<R | R2 | R3, E | E2 | E3, I, O | B>(
      this.value,
      this.matcher.when(guard, onMatch)
    )
  }

  run: ValueMatcher<R, E, I, O>["run"] = Fx.suspend(() => this.matcher.run(this.value))
}

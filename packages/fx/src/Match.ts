/**
 * @since 1.18.0
 */

import { getGuard, type GuardInput } from "@typed/guard"
import * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { identity } from "effect/Function"
import * as MutableRef from "effect/MutableRef"
import * as Option from "effect/Option"
import { isNonEmptyReadonlyArray, reduce } from "effect/Array"
import * as Scope from "effect/Scope"
import * as Fx from "./Fx.js"
import { withScopedFork } from "./internal/helpers.js"
import { FxBase } from "./internal/protos.js"
import * as RefSubject from "./RefSubject.js"
import * as Sink from "./Sink.js"
import * as Subject from "./Subject.js"

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
export interface TypeMatcher<I, O = never, E = never, R = never> {
  readonly _tag: "TypeMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<I, O, E, R>

  readonly when: <R2 = never, E2 = never, A = never, R3 = never, E3 = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<B, E3, R3>
  ) => TypeMatcher<I, O | B, E | E2 | E3, R | R2 | R3>

  readonly to: <R2 = never, E2 = never, A = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: B
  ) => TypeMatcher<I, O | B, E | E2, R | R2>

  readonly run: <R2 = never, E2 = never>(
    input: Fx.Fx<I, E2, R2>
  ) => Fx.Fx<Option.Option<O>, E | E2, R | R2 | Scope.Scope>
}

/**
 * @since 1.18.0
 */
export interface ValueMatcher<I, O = never, E = never, R = never> extends Fx.Fx<Option.Option<O>, E, R | Scope.Scope> {
  readonly _tag: "ValueMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<I, O, E, R>

  readonly value: Fx.Fx<I, E, R>

  readonly when: <A, E2, R2, R3 = never, E3 = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<B, E3, R3>
  ) => ValueMatcher<I, O | B, E | E2 | E3, R | R2 | R3>

  readonly to: <A, E2, R2, B>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: B
  ) => ValueMatcher<I, O | B, E | E2, R | R2>

  readonly getOrElse: <R2 = never, E2 = never, B = never>(
    f: () => Fx.Fx<B, E2, R2>
  ) => Fx.Fx<O | B, E | E2, R | R2 | Scope.Scope>
}

/**
 * @since 1.18.0
 */
export namespace Matcher {
  /**
   * @since 1.18.0
   */
  export interface Variance<I, O, E, R> {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _I: (_: I) => unknown
    readonly _O: (_: never) => O
  }
}

/**
 * @since 1.18.0
 */
export const type = <I>(): TypeMatcher<I> => new TypeMatcherImpl<I, never, never, never>(Chunk.empty())

/**
 * @since 1.18.0
 */
export const value = <I, E = never, R = never>(input: Fx.Fx<I, E, R>): ValueMatcher<I, never, E, R> =>
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
    readonly guard: (input: I) => Effect.Effect<Option.Option<A>, E, R>,
    readonly onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<O, E, R>
  ) {}
}

class Matched<R, E, I, A, O> {
  constructor(
    readonly when: When<R, E, I, A, O>,
    readonly ref: RefSubject.RefSubject<A>,
    readonly fiber: Fiber.Fiber<unknown>,
    readonly interrupt: Effect.Effect<void>
  ) {}
}

class TypeMatcherImpl<I, O, E, R> implements TypeMatcher<I, O, E, R> {
  readonly _tag = "TypeMatcher"
  readonly [MatcherTypeId]: TypeMatcher<I, O, E, R>[MatcherTypeId] = variance as any

  constructor(readonly cases: Chunk.Chunk<When<any, any, I, any, any>>) {
    this.when = this.when.bind(this)
    this.run = this.run.bind(this)
  }

  when<A, E2, R2, R3 = never, E3 = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<B, E3, R3>
  ): TypeMatcher<I, O | B, E | E2 | E3, R | R2 | R3> {
    return new TypeMatcherImpl<I, O | B, E | E2 | E3, R | R2 | R3>(
      Chunk.append(this.cases, new When<R | R2 | R3, E | E2 | E3, I, A, O | B>(getGuard(guard), onMatch))
    )
  }

  to<A, E2, R2, B>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: B
  ): TypeMatcher<I, O | B, E | E2, R | R2> {
    return this.when(guard, () => Fx.succeed(onMatch))
  }

  run<E2, R2>(input: Fx.Fx<I, E2, R2>): Fx.Fx<Option.Option<O>, E | E2, R | R2 | Scope.Scope> {
    const { cases } = this

    return Fx.make<Option.Option<O>, E | E2, R | R2 | Scope.Scope>((sink) =>
      withScopedFork(
        (fork, parentScope) => {
          let previous: Matched<any, any, I, any, O>

          const onMatch = <A>(
            when: When<R | R2 | Scope.Scope, E | E2, I, A, O>,
            value: A
          ) =>
            Effect.gen(function*(_) {
              if (previous?.when === when) {
                yield* _(RefSubject.set(previous.ref, value))
              } else {
                // Interrupt any previous resources
                if (previous !== undefined) {
                  yield* _(previous.interrupt)
                }

                // RefSubject to pass along to our matching function
                const refSubject = yield* _(RefSubject.of(value))

                // Track if the case is ended
                const hasEnded = MutableRef.make(false)
                // Used to signal when the case has ended
                const endSignal = Subject.unsafeMake<void>(0)

                // Run the case
                const fiber = yield* _(
                  fork(
                    Fx.mergeFirst(when.onMatch(refSubject), Fx.tap(endSignal, () => MutableRef.set(hasEnded, true)))
                      .run(
                        Sink.make(
                          (cause) =>
                            MutableRef.get(hasEnded) || Cause.isInterruptedOnly(cause)
                              ? Effect.void
                              : sink.onFailure(cause),
                          (value) => MutableRef.get(hasEnded) ? Effect.void : sink.onSuccess(Option.some(value))
                        )
                      )
                  )
                )

                previous = new Matched(
                  when,
                  refSubject,
                  fiber,
                  // Interrupt the case when the endSignal first to disallow emissions of values, but asynchonously
                  // interrupt the fiber without blocking the next match to take over.
                  Effect.all([endSignal.onSuccess(undefined), Fiber.interruptFork(fiber)], { discard: true })
                )
              }
            }).pipe(Effect.provideService(Scope.Scope, parentScope))

          function matchWhen<A>(input: I, when: When<R | R2 | Scope.Scope, E | E2, I, A, O>) {
            return Effect.gen(function*(_) {
              const matched = yield* _(when.guard(input))

              if (Option.isSome(matched)) {
                yield* _(onMatch(when, matched.value))

                return true
              } else {
                return false
              }
            })
          }

          function matchInput(input: I) {
            return Effect.gen(function*(_) {
              // Allow failures to be accumulated, such that errors do not break the overall match
              // and additional matchers can be attempted against first
              const causes: Array<Cause.Cause<E | E2>> = []

              // If there's a previous match, attempt it first to avoid re-testing all cases in order
              if (previous !== undefined) {
                const matchedExit = yield* _(matchWhen(input, previous.when), Effect.exit)

                if (Exit.isFailure(matchedExit)) {
                  causes.push(matchedExit.cause)
                } else if (matchedExit.value) {
                  return
                }
              }

              for (const when of cases) {
                // Don't test this case twice
                if (when === previous?.when) continue

                const matchedExit = yield* _(matchWhen(input, when), Effect.exit)

                if (Exit.isFailure(matchedExit)) {
                  causes.push(matchedExit.cause)
                } else if (matchedExit.value) {
                  return
                }
              }

              if (isNonEmptyReadonlyArray(causes)) {
                const [first, ...rest] = causes
                yield* _(sink.onFailure(reduce(rest, first, Cause.sequential)))
              } else {
                if (previous !== undefined) {
                  yield* _(previous.interrupt)
                }

                yield* _(sink.onSuccess(Option.none()))
              }
            })
          }

          return Fx.skipRepeats(input).run(Sink.make(
            sink.onFailure,
            matchInput
          ))
        },
        ExecutionStrategy.sequential
      )
    )
  }
}

class ValueMatcherImpl<I, O, E, R> extends FxBase<Option.Option<O>, E, R | Scope.Scope>
  implements ValueMatcher<I, O, E, R>
{
  readonly _tag = "ValueMatcher"
  readonly [MatcherTypeId]: ValueMatcher<I, O, E, R>[MatcherTypeId] = variance

  constructor(readonly value: Fx.Fx<I, E, R>, readonly matcher: TypeMatcher<I, O, E, R>) {
    super()
    this.when = this.when.bind(this)
    this.to = this.to.bind(this)
    this.getOrElse = this.getOrElse.bind(this)
  }

  run<R2>(sink: Sink.Sink<Option.Option<O>, E, R2>) {
    return this.matcher.run(this.value).run(sink)
  }

  when<A, E2, R2, R3 = never, E3 = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<B, E3, R3>
  ): ValueMatcher<I, O | B, E | E2 | E3, R | R2 | R3> {
    return new ValueMatcherImpl<I, O | B, E | E2 | E3, R | R2 | R3>(
      this.value,
      this.matcher.when(guard, onMatch)
    )
  }

  to<A, E2, R2, B>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: B
  ): ValueMatcher<I, O | B, E | E2, R | R2> {
    return this.when(guard, () => Fx.succeed(onMatch))
  }

  getOrElse: ValueMatcher<I, O, E, R>["getOrElse"] = (f) => Fx.getOrElse(this.matcher.run(this.value), f)
}

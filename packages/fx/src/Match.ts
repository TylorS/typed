/**
 * @since 1.18.0
 */

import * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { identity } from "effect/Function"
import * as MutableRef from "effect/MutableRef"
import * as Option from "effect/Option"
import { isNonEmptyReadonlyArray, reduce } from "effect/ReadonlyArray"
import * as Scope from "effect/Scope"
import * as Fx from "./Fx.js"
import type { Guard } from "./Guard.js"
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
export interface TypeMatcher<out R, out E, in out I, out O> {
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
export interface ValueMatcher<out R, out E, in out I, out O> extends Fx.Fx<R | Scope.Scope, E, Option.Option<O>> {
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

class Matched<R, E, I, A, O> {
  constructor(
    readonly when: When<R, E, I, A, O>,
    readonly ref: RefSubject.RefSubject<never, never, A>,
    readonly fiber: Fiber.Fiber<never, unknown>,
    readonly interrupt: Effect.Effect<never, never, void>
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

  run<R2, E2>(input: Fx.Fx<R2, E2, I>): Fx.Fx<R | R2 | Scope.Scope, E | E2, Option.Option<O>> {
    const { cases } = this

    return Fx.make<R | R2 | Scope.Scope, E | E2, Option.Option<O>>((sink) =>
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
                const endSignal = Subject.unsafeMake<never, void>(0)

                // Run the case
                const fiber = yield* _(
                  fork(
                    Fx.mergeFirst(when.onMatch(refSubject), Fx.tap(endSignal, () => MutableRef.set(hasEnded, true)))
                      .run(
                        Sink.make(
                          (cause) =>
                            MutableRef.get(hasEnded) || Cause.isInterruptedOnly(cause)
                              ? Effect.unit
                              : sink.onFailure(cause),
                          (value) => MutableRef.get(hasEnded) ? Effect.unit : sink.onSuccess(Option.some(value))
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

  run<R2>(sink: Sink.Sink<R2, E, Option.Option<O>>) {
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

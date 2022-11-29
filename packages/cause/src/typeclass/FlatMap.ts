import * as F from '@fp-ts/core/typeclass/FlatMap'
import { safeEval } from '@fp-ts/data'

import { Cause, Concurrent, Sequential, Timed, Traced } from '../Cause.js'

import { CauseTypeLambda } from './TypeLambda.js'

const flatMapCauseSafe = <A, B>(
  cause: Cause<A>,
  f: (a: A) => Cause<B>,
): safeEval.SafeEval<Cause<B>> =>
  safeEval.gen(function* (_) {
    const tag = cause._tag

    if (tag === 'Expected') {
      return f(cause.error)
    }

    if (tag === 'Sequential') {
      return Sequential(
        yield* _(flatMapCauseSafe(cause.left, f)),
        yield* _(flatMapCauseSafe(cause.right, f)),
      )
    }

    if (tag === 'Concurrent') {
      return Concurrent(
        yield* _(flatMapCauseSafe(cause.left, f)),
        yield* _(flatMapCauseSafe(cause.right, f)),
      )
    }

    if (tag === 'Traced') {
      return Traced(yield* _(flatMapCauseSafe(cause.cause, f)), cause.execution, cause.stack)
    }

    if (tag === 'Timed') {
      return Timed(yield* _(flatMapCauseSafe(cause.cause, f)), cause.time)
    }

    return cause
  })

export const flatMap =
  <A, B>(f: (a: A) => Cause<B>) =>
  (self: Cause<A>): Cause<B> =>
    safeEval.execute(flatMapCauseSafe(self, f))

export const FlatMap: F.FlatMap<CauseTypeLambda> = {
  flatMap,
}

export const flatten: <A>(self: Cause<Cause<A>>) => Cause<A> = F.flatten(FlatMap)

export const andThen: <B>(that: Cause<B>) => <_>(self: Cause<_>) => Cause<B> = F.andThen(FlatMap)

export const composeKleisliArrow: <B, C>(
  bfc: (b: B) => Cause<C>,
) => <A>(afb: (a: A) => Cause<B>) => (a: A) => Cause<C> = F.composeKleisliArrow(FlatMap)

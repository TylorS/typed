import { applicative } from '@fp-ts/core'
import { Kind, TypeLambda } from '@fp-ts/core/HKT'
import * as T from '@fp-ts/core/typeclass/Traversable'
import { safeEval } from '@fp-ts/data'
import { pipe } from '@fp-ts/data/Function'

import { Cause, Concurrent, Expected, Sequential, Timed, Traced } from '../Cause.js'

import { CauseTypeLambda } from './TypeLambda.js'

export const traverse =
  <F extends TypeLambda>(A: applicative.Applicative<F>) =>
  <A, R, O, E, B>(f: (a: A) => Kind<F, R, O, E, B>) =>
  (cause: Cause<A>): Kind<F, R, O, E, Cause<B>> =>
    safeEval.execute(traverseSafe(A, f, cause))

export const Traversable: T.Traversable<CauseTypeLambda> = {
  traverse,
  sequence: T.sequence<CauseTypeLambda>(traverse),
}

export const sequence = Traversable.sequence as <F extends TypeLambda>(
  A: applicative.Applicative<F>,
) => <R, O, E, A>(
  self: Cause<Kind<F, R, O, E, A>>,
) => (cause: Cause<A>) => Kind<F, R, O, E, Cause<A>>

export const traverseTap: <F extends TypeLambda>(
  F: applicative.Applicative<F>,
) => <A, R, O, E, B>(
  f: (a: A) => Kind<F, R, O, E, B>,
) => (self: Cause<A>) => Kind<F, R, O, E, Cause<A>> = T.traverseTap(Traversable)

function traverseSafe<F extends TypeLambda, A, R, O, E, B>(
  A: applicative.Applicative<F>,
  f: (a: A) => Kind<F, R, O, E, B>,
  cause: Cause<A>,
): safeEval.SafeEval<Kind<F, R, O, E, Cause<B>>> {
  return safeEval.gen(function* ($) {
    switch (cause._tag) {
      case 'Empty':
      case 'Interrupted':
      case 'Unexpected':
        return A.of<Cause<B>>(cause)
      case 'Expected':
        return pipe(
          f(cause.error),
          A.map((b): Cause<B> => Expected(b)),
        )
      case 'Sequential': {
        const left = yield* $(traverseSafe(A, f, cause.left))
        const right = yield* $(traverseSafe(A, f, cause.right))

        return pipe(
          left,
          A.product(right),
          A.map(([left, right]) => Sequential<B, B>(left, right)),
        )
      }
      case 'Concurrent': {
        const left = yield* $(traverseSafe(A, f, cause.left))
        const right = yield* $(traverseSafe(A, f, cause.right))

        return pipe(
          left,
          A.product(right),
          A.map(([left, right]) => Concurrent<B, B>(left, right)),
        )
      }

      case 'Traced': {
        return pipe(
          yield* $(traverseSafe(A, f, cause.cause)),
          A.map((cause_): Cause<B> => Traced(cause_, cause.execution, cause.stack)),
        )
      }
      case 'Timed': {
        return pipe(
          yield* $(traverseSafe(A, f, cause.cause)),
          A.map((cause_): Cause<B> => Timed(cause_, cause.time)),
        )
      }
    }
  })
}

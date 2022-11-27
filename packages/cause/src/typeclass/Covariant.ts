import * as C from '@fp-ts/core/typeclass/Covariant'
import * as safeEval from '@fp-ts/data/SafeEval'

import { Cause, Concurrent, Expected, Sequential, Traced } from '../Cause.js'

import { CauseTypeLambda } from './TypeLambda.js'

const mapCauseSafe = <A, B>(cause: Cause<A>, f: (a: A) => B): safeEval.SafeEval<Cause<B>> =>
  safeEval.gen(function* (_) {
    const tag = cause._tag

    if (tag === 'Expected') {
      return Expected(cause.time, f(cause.error))
    }

    if (tag === 'Sequential') {
      return Sequential(
        yield* _(mapCauseSafe(cause.left, f)),
        yield* _(mapCauseSafe(cause.right, f)),
      )
    }

    if (tag === 'Concurrent') {
      return Concurrent(
        yield* _(mapCauseSafe(cause.left, f)),
        yield* _(mapCauseSafe(cause.right, f)),
      )
    }

    if (tag === 'Traced') {
      return Traced(yield* _(mapCauseSafe(cause.cause, f)), cause.executionTrace, cause.stackTrace)
    }

    return cause
  })

export const map =
  <A, B>(f: (a: A) => B) =>
  (self: Cause<A>): Cause<B> =>
    safeEval.execute(mapCauseSafe(self, f))

export const Covariant: C.Covariant<CauseTypeLambda> = C.make(map)

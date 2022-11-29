import { Kind, TypeLambda } from '@fp-ts/core/HKT'
import * as C from '@fp-ts/core/typeclass/Covariant'
import * as safeEval from '@fp-ts/data/SafeEval'

import { Cause, Concurrent, Expected, Sequential, Traced } from '../Cause.js'

import { CauseTypeLambda } from './TypeLambda.js'

const mapCauseSafe = <A, B>(cause: Cause<A>, f: (a: A) => B): safeEval.SafeEval<Cause<B>> =>
  safeEval.gen(function* (_) {
    const tag = cause._tag

    if (tag === 'Expected') {
      return Expected(f(cause.error))
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
      return Traced(
        yield* _(mapCauseSafe(cause.cause, f)),
        cause.execution,
        cause.stack,
        cause.time,
      )
    }
    return cause
  })

export const map =
  <A, B>(f: (a: A) => B) =>
  (self: Cause<A>): Cause<B> =>
    safeEval.execute(mapCauseSafe(self, f))

export const Covariant: C.Covariant<CauseTypeLambda> = C.make(map)

export const as: <B>(value: B) => <A>(cause: Cause<A>) => Cause<B> = C.as(Covariant)

export const asUnit: <A>(cause: Cause<A>) => Cause<void> = C.asUnit(Covariant)

export const flap: <A>(a: A) => <B>(self: Cause<(a: A) => B>) => Cause<B> = C.flap(Covariant)

export const imap: <A, B>(to: (a: A) => B, from: (b: B) => A) => (self: Cause<A>) => Cause<B> =
  C.imap<CauseTypeLambda>(Covariant.map)

const let_: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => B,
) => (self: Cause<A>) => Cause<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> =
  C.let(Covariant)

export { let_ as let }

export const mapComposition: <T extends TypeLambda>(
  other: C.Covariant<T>,
) => <A, B>(
  f: (a: A) => B,
) => <FR, FO, FE>(self: Kind<T, FR, FO, FE, Cause<A>>) => Kind<T, FR, FO, FE, Cause<B>> = <
  T extends TypeLambda,
>(
  other: C.Covariant<T>,
) => C.mapComposition(other, Covariant)

export const mapCompositionFlipped: <T extends TypeLambda>(
  other: C.Covariant<T>,
) => <A, B>(
  f: (a: A) => B,
) => <FR, FO, FE>(self: Cause<Kind<T, FR, FO, FE, A>>) => Cause<Kind<T, FR, FO, FE, B>> = <
  T extends TypeLambda,
>(
  other: C.Covariant<T>,
) => C.mapComposition(Covariant, other)

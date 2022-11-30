import * as Semigroup from '@fp-ts/core/typeclass/Semigroup'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Cause from '@typed/cause'

export type Exit<E, A> = Either.Either<Cause.Cause<E>, A>

export const fromCause = <E>(cause: Cause.Cause<E>): Exit<E, never> => Either.left(cause)

export const of = <A>(value: A): Exit<never, A> => Either.right(value)

const seqCauseSemigroup = Cause.getSequentialSemigroup<any>()

export const makeSequentialSemigroup = <E, A>(
  A: Semigroup.Semigroup<A> = Semigroup.first<A>(),
): Semigroup.Semigroup<Exit<E, A>> =>
  Semigroup.fromCombine(
    (second) => (first) =>
      pipe(
        first,
        Either.match(
          (cause1) =>
            pipe(
              second,
              Either.match(
                (cause2) => Either.left(seqCauseSemigroup.combine(cause2)(cause1)),
                () => Either.left(cause1),
              ),
            ),
          (a1) =>
            pipe(
              second,
              Either.match(Either.left, (a2) => Either.right(A.combine(a2)(a1))),
            ),
        ),
      ),
  )

const concurrentCauseSemigroup = Cause.getConcurrentSemigroup<any>()

export const makeConcurrentSemigroup = <E, A>(
  A: Semigroup.Semigroup<A> = Semigroup.first<A>(),
): Semigroup.Semigroup<Exit<E, A>> =>
  Semigroup.fromCombine(
    (second) => (first) =>
      pipe(
        first,
        Either.match(
          (cause1) =>
            pipe(
              second,
              Either.match(
                (cause2) => Either.left(concurrentCauseSemigroup.combine(cause2)(cause1)),
                () => Either.left(cause1),
              ),
            ),
          (a1) =>
            pipe(
              second,
              Either.match(Either.left, (a2) => Either.right(A.combine(a2)(a1))),
            ),
        ),
      ),
  )

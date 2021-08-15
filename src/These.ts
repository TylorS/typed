import * as EI from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as TH from 'fp-ts/These'

/**
 * Convert These<E, A> into an Either<E, A>. If the These is a Both<E, A>
 * a Right<A> will be returned
 * @category Combinator
 * @since 0.12.1
 */
export const absolve = <E, A>(these: TH.These<E, A>): EI.Either<E, A> =>
  pipe(
    these,
    TH.matchW(EI.left, EI.right, (_, x) => EI.right(x)),
  )

/**
 * Convert These<E, A> into an Either<E, A>. If the These<E, A> is a Both<E, A>
 * a Lef<E> will be returned
 * @category Combinator
 * @since 0.12.1
 */
export const condemn = <E, A>(these: TH.These<E, A>): EI.Either<E, A> =>
  pipe(these, TH.matchW(EI.left, EI.right, EI.left))

export * from 'fp-ts/These'

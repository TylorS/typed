import { MonadRec2 } from '@typed/fp/MonadRec'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Either, isLeft } from 'fp-ts/Either'
import { FromIO2 } from 'fp-ts/FromIO'
import { Functor2 } from 'fp-ts/Functor'
import { ap as ap_, Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import { doFx } from './doFx'
import { Fx } from './Fx'
import { fromIO, pure } from './Pure'

export const URI = '@typed/fp/Fx'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Fx<E, A>
  }
}

export const map = <A, B>(f: (value: A) => B) => <E>(fa: Fx<E, A>): Fx<E, B> =>
  doFx(function* () {
    return f(yield* fa)
  })

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const of = pure

export const Pointed: Pointed2<URI> = {
  ...Functor,
  of,
}

export const chain = <A, E1, B>(f: (value: A) => Fx<E1, B>) => <E2>(
  fa: Fx<E2, A>,
): Fx<E1 | E2, B> =>
  doFx(function* () {
    const a = yield* fa

    return yield* f(a)
  })

export const Monad: Monad2<URI> = { ...Pointed, chain }

export const chainRec = <A, E, B>(f: (value: A) => Fx<E, Either<A, B>>) => (value: A): Fx<E, B> =>
  doFx(function* () {
    let either = yield* f(value)

    while (isLeft(either)) {
      either = yield* f(either.left)
    }

    return either.right
  })

export const MonadRec: MonadRec2<URI> = { ...Monad, chainRec }

export const ap = ap_(Monad) as <E1, A>(
  fa: Fx<E1, A, unknown>,
) => <E2, B>(fab: Fx<E2, (a: A) => B, unknown>) => Fx<E1 | E2, B, unknown>

export const Apply: Apply2<URI> = { ...Functor, ap }

export const Applicative: Applicative2<URI> = { ...Pointed, ...Apply }

export const FromIO: FromIO2<URI> = { URI, fromIO }

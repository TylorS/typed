import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'

import { Arity1, pipe } from './function'
import { MonadRec2 } from './MonadRec'
import * as S from './Stream'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface ReaderStream<R, A> extends Re.Reader<R, S.Stream<A>> {}

export type GetRequirements<A> = A extends ReaderStream<infer R, any> ? R : never
export type GetValue<A> = A extends ReaderStream<any, infer R> ? R : never

export const ap: <R, A>(
  fa: ReaderStream<R, A>,
) => <B>(fab: ReaderStream<R, Arity1<A, B>>) => ReaderStream<R, B> = RT.ap(S.Apply)

export const chain = RT.chain(S.Chain) as <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>,
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>

export const chainFirst =
  <A, R, B>(f: (a: A) => ReaderStream<R, B>) =>
  (ma: ReaderStream<R, A>): ReaderStream<R, A> =>
    pipe(
      ma,
      chain((a) =>
        pipe(
          a,
          f,
          chain(() => of(a)),
        ),
      ),
    )

export const fromReader: <R, A>(ma: Re.Reader<R, A>) => ReaderStream<R, A> = RT.fromReader(
  S.Pointed,
)

export const map: <A, B>(f: (a: A) => B) => <R>(fa: ReaderStream<R, A>) => ReaderStream<R, B> =
  RT.map(S.Functor)

export const of: <A, R = unknown>(a: A) => ReaderStream<R, A> = RT.of(S.Pointed)

export function chainRec<A, E, B>(
  f: (value: A) => ReaderStream<E, Either<A, B>>,
): (value: A) => ReaderStream<E, B> {
  return (value) => (env) => S.chainRec((a: A) => f(a)(env))(value)
}

export const URI = '@typed/fp/ReaderStream'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReaderStream<E, A>
  }
}

declare module './Hkt' {
  export interface UriToVariance {
    [URI]: V<E, Contravariant>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
  map,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

import { MonadRec3 } from '@fp/MonadRec'
import * as SE from '@fp/StreamEither'
import { Applicative3 } from 'fp-ts/Applicative'
import { Apply3 } from 'fp-ts/Apply'
import { Chain3 } from 'fp-ts/Chain'
import { ChainRec3 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface ReaderStreamEither<R, E, A> extends Re.Reader<R, SE.StreamEither<E, A>> {}

export type GetRequirements<A> = A extends ReaderStreamEither<infer R, any, any> ? R : never
export type GetLeft<A> = A extends ReaderStreamEither<any, infer R, any> ? R : never
export type GetRight<A> = A extends ReaderStreamEither<any, any, infer R> ? R : never

export const ap = RT.ap(SE.Apply)
export const chain = RT.chain(SE.Chain)
export const fromReader = RT.fromReader(SE.Pointed)
export const map = RT.map(SE.Functor)
export const of = RT.of(SE.Pointed)

export const URI = '@typed/fp/ReaderStreamEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: ReaderStreamEither<R, E, A>
  }
}

declare module '@fp/Hkt' {
  export interface UriToVariance {
    [URI]: V<R, Contravariant> & V<E, Covariant>
  }
}

export const Pointed: Pointed3<URI> = {
  of,
}

export const Functor: Functor3<URI> = {
  map,
}

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain3<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

export function chainRec<A, R, E, B>(
  f: (value: A) => ReaderStreamEither<R, E, Either<A, B>>,
): (value: A) => ReaderStreamEither<R, E, B> {
  return (value) => (env) => SE.chainRec((a: A) => f(a)(env))(value)
}

export const ChainRec: ChainRec3<URI> = {
  chainRec,
}

export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

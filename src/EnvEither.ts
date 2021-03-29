import * as Env from './Env'
import * as E from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import { Semigroup } from 'fp-ts/Semigroup'
import * as hkt from './Hkt'

export interface EnvEither<R, E, A> extends hkt.Kind<[Env.URI, E.URI], [R, E, A]> {}

export const alt = ET.alt(Env.Monad)
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(Env.Monad, semigroup)
export const ap = ET.ap(Env.Apply)
export const bimap = ET.bimap(Env.Functor)
export const bracket = ET.bracket(Env.Monad)
export const chain = ET.chain(Env.Monad)
export const getOrElse = ET.getOrElse(Env.Monad)
export const getOrElseE = ET.getOrElseE(Env.Monad)
export const left = ET.left(Env.Monad)
export const fromEnvL = ET.leftF(Env.Monad)
export const map = ET.map(Env.Monad)
export const mapLeft = ET.mapLeft(Env.Monad)
export const match = ET.match(Env.Monad)
export const matchE = ET.matchE(Env.Monad)
export const orElse = ET.orElse(Env.Monad)
export const orElseFirst = ET.orElseFirst(Env.Monad)
export const orLeft = ET.orLeft(Env.Monad)
export const right = ET.right(Env.Monad)
export const fromEnvR = ET.rightF(Env.Monad)
export const swap = ET.swap(Env.Functor)
export const toUnion = ET.toUnion(Env.Functor)

export const URI = '@typed/fp/EnvEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: EnvEither<R, E, A>
  }
}

declare module './Hkt' {
  export interface VarianceMap {
    [URI]: V<hkt.R, hkt.Contravariant> & V<hkt.E, hkt.Covariant>
  }
}

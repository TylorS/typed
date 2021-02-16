import { fromIO } from '@typed/fp/Fx'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { FromIO1 } from 'fp-ts/FromIO'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import { Pointed1 } from 'fp-ts/Pointed'
import { sequence } from 'fp-ts/ReadonlyArray'

import { ap, chain, GetResult, IOFx, map, of } from './IoFx'

export const URI = '@typed/fp/EitherFx'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: IOFx<A>
  }
}

export const Functor: Functor1<URI> = {
  URI,
  map,
}

export const Pointed: Pointed1<URI> = {
  ...Functor,
  of,
}

export const Apply: Apply1<URI> = {
  ...Functor,
  ap: ap as Apply1<URI>['ap'],
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const Monad: Monad1<URI> = {
  ...Functor,
  ...Pointed,
  chain: chain as Monad1<URI>['chain'],
}

export const FromIO: FromIO1<URI> = {
  URI,
  fromIO,
}

export const zip = (sequence(Applicative) as unknown) as <Effs extends readonly IOFx<any>[]>(
  envs: Effs,
) => IOFx<{ readonly [K in keyof Effs]: GetResult<Effs[K]> }>

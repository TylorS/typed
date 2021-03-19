import { fromIO } from '@typed/fp/Fx'
import { Applicative1 } from 'fp-ts/dist/Applicative'
import { Apply1 } from 'fp-ts/dist/Apply'
import { FromIO1 } from 'fp-ts/dist/FromIO'
import { Functor1 } from 'fp-ts/dist/Functor'
import { Monad1 } from 'fp-ts/dist/Monad'
import { Pointed1 } from 'fp-ts/dist/Pointed'
import { traverse } from 'fp-ts/dist/ReadonlyArray'

import { ap, chain, GetResult, IoFx, map, of } from './IOFx'

export const URI = '@typed/fp/EitherFx'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind<A> {
    [URI]: IoFx<A>
  }
}

export const Functor: Functor1<URI> = {
  URI,
  map,
}

export const Pointed: Pointed1<URI> = {
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

export const zip = (traverse(Applicative)(of) as unknown) as <Effs extends readonly IoFx<any>[]>(
  envs: Effs,
) => IoFx<{ readonly [K in keyof Effs]: GetResult<Effs[K]> }>

import { Alt as Alt_, fromTask as fromTask_ } from '@typed/fp/EnvEither'
import { fromIO } from '@typed/fp/Fx'
import { Widen } from '@typed/fp/Widen'
import { Alt3 } from 'fp-ts/dist/Alt'
import { Applicative3 } from 'fp-ts/dist/Applicative'
import { Apply3 } from 'fp-ts/dist/Apply'
import { FromIO3 } from 'fp-ts/dist/FromIO'
import { FromTask3 } from 'fp-ts/dist/FromTask'
import { flow, pipe } from 'fp-ts/dist/function'
import { Functor3 } from 'fp-ts/dist/Functor'
import { Monad3 } from 'fp-ts/dist/Monad'
import { Pointed3 } from 'fp-ts/dist/Pointed'
import { sequence } from 'fp-ts/dist/ReadonlyArray'

import {
  ap,
  chain,
  EffEither,
  fromEnvEither,
  GetLeft,
  GetRequirements,
  GetRight,
  map,
  of,
  toEnvEither,
} from './EffEither'

export const URI = '@typed/fp/Eff'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: EffEither<R, E, A>
  }
}

export const Functor: Functor3<URI> = {
  URI,
  map,
}

export const Pointed: Pointed3<URI> = {
  of,
}

export const Apply: Apply3<URI> = {
  ...Functor,
  ap: ap as Apply3<URI>['ap'],
}

export const Applicative: Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const Monad: Monad3<URI> = {
  ...Functor,
  ...Pointed,
  chain: chain as Monad3<URI>['chain'],
}

export const FromIO: FromIO3<URI> = {
  URI,
  fromIO,
}

export const FromTask: FromTask3<URI> = {
  ...FromIO,
  fromTask: (task) => fromEnvEither(fromTask_(task)),
}

export const fromTask = FromTask.fromTask

export const Alt: Alt3<URI> = {
  ...Functor,
  alt: (snd) => (fst) => pipe(fst, toEnvEither, Alt_.alt(flow(snd, toEnvEither)), fromEnvEither),
}

export const alt = Alt.alt

export const zip = (sequence(Applicative) as unknown) as <
  Effs extends readonly EffEither<any, any, any>[]
>(
  envs: Effs,
) => EffEither<
  Widen<GetRequirements<Effs[number]>, 'intersection'>,
  GetLeft<Effs[number]>,
  { readonly [K in keyof Effs]: GetRight<Effs[K]> }
>

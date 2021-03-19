import { Alt as Alt_, fromReader as fromReader_ } from '@typed/fp/Env'
import { fromIO } from '@typed/fp/Fx'
import { MonadReader2 } from '@typed/fp/MonadReader'
import { MonadRec2 } from '@typed/fp/MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '@typed/fp/Provide'
import { fromTask as fromTask_ } from '@typed/fp/Resume'
import { Widen } from '@typed/fp/Widen'
import { Alt2 } from 'fp-ts/dist/Alt'
import { Applicative2 } from 'fp-ts/dist/Applicative'
import { Apply2 } from 'fp-ts/dist/Apply'
import { ChainRec2 } from 'fp-ts/dist/ChainRec'
import { FromIO2 } from 'fp-ts/dist/FromIO'
import { FromReader2 } from 'fp-ts/dist/FromReader'
import { FromTask2 } from 'fp-ts/dist/FromTask'
import { flow, pipe } from 'fp-ts/dist/function'
import { Functor2 } from 'fp-ts/dist/Functor'
import { Monad2 } from 'fp-ts/dist/Monad'
import { Pointed2 } from 'fp-ts/dist/Pointed'
import { traverse } from 'fp-ts/dist/ReadonlyArray'

import {
  ap,
  chain,
  chainRec,
  Eff,
  fromEnv,
  GetRequirements,
  GetResult,
  map,
  of,
  toEnv,
} from './Eff'
import { provideAll, provideSome, useAll, useSome } from './provide'

export const URI = '@typed/fp/Eff'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Eff<E, A>
  }
}

export const FromReader: FromReader2<URI> = {
  URI,
  fromReader: flow(fromReader_, fromEnv),
}

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap: ap as Apply2<URI>['ap'],
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Monad: Monad2<URI> = {
  ...Functor,
  ...Pointed,
  chain: chain as Monad2<URI>['chain'],
}

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  ...ChainRec,
}

export const MonadReader: MonadReader2<URI> = {
  ...Monad,
  ...FromReader,
}

export const ProvideSome: ProvideSome2<URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll2<URI> = {
  provideAll,
}

export const UseSome: UseSome2<URI> = {
  useSome,
}

export const UseAll: UseAll2<URI> = {
  useAll,
}

export const Provide: Provide2<URI> = {
  provideSome,
  provideAll,
  useSome,
  useAll,
}

export const FromIO: FromIO2<URI> = {
  URI,
  fromIO,
}

export const FromTask: FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => fromEnv(() => fromTask_(task)),
}

export const fromTask = FromTask.fromTask

export const Alt: Alt2<URI> = {
  ...Functor,
  alt: (snd) => (fst) => pipe(fst, toEnv, Alt_.alt(flow(snd, toEnv)), fromEnv),
}

export const alt = Alt.alt

export const zip = (traverse(Applicative)(of) as unknown) as <
  Effs extends readonly Eff<any, any>[]
>(
  envs: Effs,
) => Eff<
  Widen<GetRequirements<Effs[number]>, 'intersection'>,
  { readonly [K in keyof Effs]: GetResult<Effs[K]> }
>

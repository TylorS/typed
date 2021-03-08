import { Ask2 } from '@typed/fp/Ask'
import { MonadRec2 } from '@typed/fp/MonadRec'
import { fromTask as fromTask_, race, sync } from '@typed/fp/Resume'
import { Widen } from '@typed/fp/Widen'
import { Alt2 } from 'fp-ts/dist/Alt'
import { Applicative2 } from 'fp-ts/dist/Applicative'
import { Apply2 } from 'fp-ts/dist/Apply'
import { bind as bind_ } from 'fp-ts/dist/Chain'
import { ChainRec2 } from 'fp-ts/dist/ChainRec'
import { FromIO2 } from 'fp-ts/dist/FromIO'
import { FromTask2 } from 'fp-ts/dist/FromTask'
import { pipe } from 'fp-ts/dist/function'
import { bindTo as bindTo_, Functor2, tupled as tupled_ } from 'fp-ts/dist/Functor'
import { Monad2 } from 'fp-ts/dist/Monad'
import { Pointed2 } from 'fp-ts/dist/Pointed'
import { sequence } from 'fp-ts/dist/ReadonlyArray'

import { MonadAsk2 } from '@typed/fp/MonadAsk'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '@typed/fp/Provide'
import { ap, ask, chain, chainRec, Env, GetRequirements, GetResume, map, of } from './Env'
import { provideAll, provideSome, useAll, useSome } from './provide'

export const URI = '@typed/fp/Env'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Env<E, A>
  }
}

export const Ask: Ask2<URI> = { URI, ask }

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

export const MonadAsk: MonadAsk2<URI> = {
  ...Monad,
  ...Ask,
}

export const ChainRec: ChainRec2<URI> = {
  URI,
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  ...ChainRec,
}

export const FromIO: FromIO2<URI> = {
  URI,
  fromIO: (io) => () => sync(io),
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => fromTask_(task),
}

export const fromTask = FromTask.fromTask

export const Alt: Alt2<URI> = {
  ...Functor,
  alt: (snd) => (fst) => (r) => pipe(fst(r), race(snd()(r))),
}

export const Do: Env<never, {}> = () => sync(() => Object.create(null))
export const bindTo = bindTo_(Functor)
export const bind = bind_(Monad) as <N extends string, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Env<E, B>,
) => <E2>(ma: Env<E2, A>) => Env<E & E2, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
export const tupled = tupled_(Functor)

export const zip = (sequence(Applicative) as unknown) as <Envs extends readonly Env<any, any>[]>(
  envs: Envs,
) => Env<
  Widen<{ readonly [K in keyof Envs]: GetRequirements<Envs[K]> }[number], 'intersection'>,
  { readonly [K in keyof Envs]: GetResume<Envs[K]> }
>

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

import { MonadRec2 } from '@fp/MonadRec'
import { race, sync } from '@fp/Resume'
import { Widen } from '@fp/Widen'
import { Alt2 } from 'fp-ts/dist/Alt'
import { Applicative2 } from 'fp-ts/dist/Applicative'
import { Apply2 } from 'fp-ts/dist/Apply'
import { pipe } from 'fp-ts/dist/function'
import { bindTo as bindTo_, Functor2, tupled as tupled_ } from 'fp-ts/dist/Functor'
import { bind as bind_, Monad2 } from 'fp-ts/dist/Monad'
import { Pointed2 } from 'fp-ts/dist/Pointed'
import { sequence } from 'fp-ts/dist/ReadonlyArray'

import { ap, chain, chainRec, Env, GetRequirements, GetResume, map, of } from './Env'

export const URI = '@typed/fp/Env'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Env<E, A>
  }
}

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const Pointed: Pointed2<URI> = {
  ...Functor,
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

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

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

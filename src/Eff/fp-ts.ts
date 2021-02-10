import { Alt as Alt_ } from '@fp/Env'
import { Widen } from '@fp/Widen'
import { Alt2 } from 'fp-ts/dist/Alt'
import { Applicative2 } from 'fp-ts/dist/Applicative'
import { Apply2 } from 'fp-ts/dist/Apply'
import { pipe } from 'fp-ts/dist/function'
import { Functor2 } from 'fp-ts/dist/Functor'
import { Monad2 } from 'fp-ts/dist/Monad'
import { Pointed2 } from 'fp-ts/dist/Pointed'
import { sequence } from 'fp-ts/dist/ReadonlyArray'

import { ap, chain, doEff, Eff, GetRequirements, GetResult, map, of, toEnv } from './Eff'

export const URI = '@typed/fp/Eff'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Eff<E, A>
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

export const Alt: Alt2<URI> = {
  ...Functor,
  alt: ((snd) => (fst) =>
    doEff(function* (_) {
      return yield* pipe(
        fst,
        toEnv,
        Alt_.alt(() => toEnv(snd())),
        _,
      )
    })) as Alt2<URI>['alt'],
}

export const zip = (sequence(Applicative) as unknown) as <Effs extends readonly Eff<any, any>[]>(
  envs: Effs,
) => Eff<
  Widen<GetRequirements<Effs[number]>, 'intersection'>,
  { readonly [K in keyof Effs]: GetResult<Effs[K]> }
>

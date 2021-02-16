import { fromIO } from '@typed/fp/Fx'
import { Alt2 } from 'fp-ts/Alt'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Alt as Alt_ } from 'fp-ts/Either'
import { FromIO2 } from 'fp-ts/FromIO'
import { pipe } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import { sequence } from 'fp-ts/ReadonlyArray'

import {
  ap,
  chain,
  doEither,
  EitherFx,
  GetRequirements,
  GetResult,
  map,
  of,
  toEither,
} from './EitherFx'

export const URI = '@typed/fp/EitherFx'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: EitherFx<E, A>
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

export const FromIO: FromIO2<URI> = {
  URI,
  fromIO,
}

export const Alt: Alt2<URI> = {
  ...Functor,
  alt: ((snd) => (fst) =>
    doEither(function* (_) {
      return yield* pipe(
        fst,
        toEither,
        Alt_.alt(() => toEither(snd())),
        _,
      )
    })) as Alt2<URI>['alt'],
}

export const zip = (sequence(Applicative) as unknown) as <
  Effs extends readonly EitherFx<any, any>[]
>(
  envs: Effs,
) => EitherFx<GetRequirements<Effs[number]>, { readonly [K in keyof Effs]: GetResult<Effs[K]> }>

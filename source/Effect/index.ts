import { Monad2 } from 'fp-ts/es6/Monad'
import { ap, apSeq } from './ap'
import { chain } from './chain'
import { Effect, noEnv } from './Effect'
import { map } from './map'

export const URI = '@typed/fp/Effect' as const
export type URI = typeof URI

declare module 'fp-ts/es6/HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: Effect<E, A>
  }
}

export const effect: Monad2<URI> = {
  URI,
  of: noEnv,
  map: (fa, f) => map(f, fa),
  ap,
  chain: (fa, f) => chain(f, fa),
}

export const effectSeq: Monad2<URI> = {
  URI,
  of: noEnv,
  map: (fa, f) => map(f, fa),
  ap: apSeq,
  chain: (fa, f) => chain(f, fa),
}

export * from './Effect'
export * from './ap'
export * from './chain'
export * from './map'
export * from './provide'
export * from './runEffect'

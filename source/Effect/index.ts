import { Monad2 } from 'fp-ts/es6/Monad'
import { ap, apSeq } from './ap'
import { chain } from './chain'
import { Effect } from './Effect'
import { map } from './map'

export const URI = '@typed/fp/Effect'
export type URI = typeof URI

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Effect<E, A>
  }
}

export const effect: Monad2<URI> = {
  URI,
  of: Effect.of,
  ap,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
}

export const effectSeq: Monad2<URI> = {
  URI,
  of: Effect.of,
  ap: apSeq,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
}

export * from './ap'
export * from './ask'
export * from './chain'
export * from './chainResume'
export * from './doEffect'
export * from './Effect'
export * from './failures'
export * from './fromEnv'
export * from './map'
export * from './provide'
export * from './runEffect'
export * from './runResume'
export * from './toEnv'

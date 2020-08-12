import { ap, apSeq } from './ap'
import { chain } from './chain'
import { Effect } from './Effect'
import { map } from './map'
import { MonadIO2 } from 'fp-ts/es6/MonadIO'

export const EffectURI = '@typed/fp/Effect'
export type EffectURI = typeof EffectURI

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind2<E, A> {
    [EffectURI]: Effect<E, A>
  }
}

export const effect: MonadIO2<EffectURI> = {
  URI: EffectURI,
  of: Effect.of,
  fromIO: Effect.fromIO,
  ap,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
}

export const effectSeq: MonadIO2<EffectURI> = {
  ...effect,
  ap: apSeq,
}

export * from './ap'
export * from './ask'
export * from './chain'
export * from './doEffect'
export * from './Effect'
export * from './failures'
export * from './fromEnv'
export * from './fromPromise'
export * from './map'
export * from './provide'
export * from './runEffect'
export * from './runResume'
export * from './toEnv'

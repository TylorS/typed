import { flow } from 'fp-ts/es6/function'
import { Monad1, Monad2 } from 'fp-ts/es6/Monad'
import { ap, apSeq } from './ap'
import { apResume } from './apResume'
import { chain } from './chain'
import { chainResume } from './chainResume'
import { Effect, Resume, sync } from './Effect'
import { map } from './map'

export const EffectURI = '@typed/fp/Effect'
export type EffectURI = typeof EffectURI

export const ResumeURI = '@typed/fp/Resume'
export type ResumeURI = typeof ResumeURI

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind2<E, A> {
    [EffectURI]: Effect<E, A>
  }

  export interface URItoKind<A> {
    [ResumeURI]: Resume<A>
  }
}

export const effect: Monad2<EffectURI> = {
  URI: EffectURI,
  of: Effect.of,
  ap,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
}

export const effectSeq: Monad2<EffectURI> = {
  URI: EffectURI,
  of: Effect.of,
  ap: apSeq,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
}

export const resume: Monad1<ResumeURI> = {
  URI: ResumeURI,
  of: sync,
  ap: apResume,
  map: (fa, f) => chainResume(fa, flow(f, sync)),
  chain: chainResume,
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

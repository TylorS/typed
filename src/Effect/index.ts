import { ap, apSeq } from '@typed/fp/Effect/ap'
import { chain } from '@typed/fp/Effect/chain'
import { Effect, EnvOf, ReturnOf } from '@typed/fp/Effect/Effect'
import { map } from '@typed/fp/Effect/map'
import { Alt2 } from 'fp-ts/es6/Alt'
import { MonadIO2 } from 'fp-ts/es6/MonadIO'
import { readonlyArray } from 'fp-ts/es6/ReadonlyArray'
import { U } from 'ts-toolbelt'

import { race } from './race'

/**
 * @since 0.0.1
 */
export const URI = '@typed/fp/Effect'

/**
 * @since 0.0.1
 */
export type URI = typeof URI

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Effect<E, A>
  }
}

/**
 * @since 0.0.1
 */
export const effect: MonadIO2<URI> & Alt2<URI> = {
  URI,
  of: Effect.of,
  fromIO: Effect.fromIO,
  ap,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
  alt: (fa, f) => race(fa, f()),
}

export const zip: ZipEffects = (readonlyArray.sequence(effect) as unknown) as ZipEffects

/**
 * @since 0.0.1
 */
export const effectSeq: MonadIO2<URI> & Alt2<URI> = {
  ...effect,
  ap: apSeq,
}

export const zipSeq: ZipEffects = (readonlyArray.sequence(effect) as unknown) as ZipEffects

export type ZipEffects = <A extends ReadonlyArray<Effect<any, any>>>(
  effects: A,
) => Effect<
  U.IntersectOf<{ [K in keyof A]: EnvOf<A[K]> }[number]>,
  { [K in keyof A]: ReturnOf<A[K]> }
>

export * from '@typed/fp/Effect/ap'
export * from '@typed/fp/Effect/ask'
export * from '@typed/fp/Effect/chain'
export * from '@typed/fp/Effect/doEffect'
export * from '@typed/fp/Effect/Effect'
export * from '@typed/fp/Effect/failures'
export * from '@typed/fp/Effect/fibers'
export * from '@typed/fp/Effect/fromEnv'
export * from '@typed/fp/Effect/fromPromise'
export * from '@typed/fp/Effect/map'
export * from '@typed/fp/Effect/memo'
export * from '@typed/fp/Effect/provide'
export * from '@typed/fp/Effect/race'
export * from '@typed/fp/Effect/runEffect'
export * from '@typed/fp/Effect/runResume'
export * from '@typed/fp/Effect/toEnv'

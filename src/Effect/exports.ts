import { And } from '@typed/fp/common/exports'
import { ap, apSeq } from '@typed/fp/Effect/ap'
import { chain } from '@typed/fp/Effect/chain'
import { Effect, EnvOf, ReturnOf } from '@typed/fp/Effect/Effect'
import { map } from '@typed/fp/Effect/map'
import { Cast } from 'Any/Cast'
import { Alt2 } from 'fp-ts/es6/Alt'
import { MonadIO2 } from 'fp-ts/es6/MonadIO'
import { readonlyArray } from 'fp-ts/es6/ReadonlyArray'

import { race } from './race'

/**
 * @since 0.0.1
 */
export const URI = '@typed/fp/Effect/exports'

/**
 * @since 0.0.1
 */
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Effect<E, A>
  }
}

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

export const zipSeq: ZipEffects = (readonlyArray.sequence(effectSeq) as unknown) as ZipEffects

export type ZipEffects = <A extends ReadonlyArray<Effect<any, any>>>(
  effects: A,
) => Effect<ZipEnvOf<A>, ZipReturnOf<A>>

export type ZipEnvOf<A extends ReadonlyArray<Effect<any, any>>> = And<
  Cast<{ readonly [K in keyof A]: EnvOf<A[K]> }, ReadonlyArray<any>>
>

export type ZipReturnOf<A extends ReadonlyArray<Effect<any, any>>> = {
  readonly [K in keyof A]: ReturnOf<A[K]>
}

export * from './ap'
export * from './ask'
export * from './chain'
export * from './doEffect'
export * from './Effect'
export * from './failures'
export * from './fromEnv'
export * from './fromReader'
export * from './fromReaderTask'
export * from './fromTask'
export * from './lazy'
export * from './map'
export * from './memo'
export * from './provide'
export * from './provideWith'
export * from './race'
export * from './runEffect'
export * from './runResume'
export * from './toEnv'

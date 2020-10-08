import { Alt2 } from 'fp-ts/Alt'
import { MonadIO2 } from 'fp-ts/MonadIO'

import { ap, apSeq } from './ap'
import { chain } from './chain'
import { Effect } from './Effect'
import { map } from './map'
import { race } from './race'

/**
 * @since 0.0.1
 */
export const URI = '@typed/fp/Effect'

/**
 * @since 0.0.1
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
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

/**
 * @since 0.0.1
 */
export const effectSeq: MonadIO2<URI> & Alt2<URI> = {
  ...effect,
  ap: apSeq,
}

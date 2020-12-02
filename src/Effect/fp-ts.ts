import { Alt2 } from 'fp-ts/Alt'
import { MonadTask2 } from 'fp-ts/MonadTask'

import { ap, apSeq } from './ap'
import { chain } from './chain'
import { Effect } from './Effect'
import { fromTask } from './fromTask'
import { map } from './map'
import { race } from './race'

export const URI = '@typed/fp/Effect'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Effect<E, A>
  }
}

/**
 * MonadTask + Alt instances for Effect with a parallel Applicative instance.
 */
export const effect: MonadTask2<URI> & Alt2<URI> = {
  URI,
  of: Effect.of,
  fromIO: Effect.fromIO,
  fromTask: fromTask,
  ap,
  map: (fa, f) => map(f, fa),
  chain: (fa, f) => chain(f, fa),
  alt: (fa, f) => race(fa, f()),
}

/**
 * MonadTask + Alt instances for Effect with a sequential Applicative instance.
 */
export const effectSeq: MonadTask2<URI> & Alt2<URI> = {
  ...effect,
  ap: apSeq,
}

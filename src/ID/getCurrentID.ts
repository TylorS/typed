import {
  FromReader,
  FromReader2,
  FromReader3,
  FromReader3C,
  FromReader4,
} from 'fp-ts/dist/FromReader'
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { HKT, Kind2, Kind3, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { ID } from './ID'

export interface CurrentID<K = unknown> {
  readonly currentID: ID<K>
}

export function getCurrentID<F extends URIS2>(
  M: FromReader2<F> & Functor2<F>,
): <K>() => Kind2<F, CurrentID<K>, ID<K>>

export function getCurrentID<F extends URIS3>(
  M: FromReader3<F> & Functor3<F>,
): <K, E = never>() => Kind3<F, CurrentID<K>, E, ID<K>>

export function getCurrentID<F extends URIS3, E>(
  M: FromReader3C<F, E> & Functor3C<F, E>,
): <K>() => Kind3<F, CurrentID<K>, E, ID<K>>

export function getCurrentID<F extends URIS4>(
  M: FromReader4<F> & Functor4<F>,
): <K, E = never>() => Kind3<F, CurrentID<K>, E, ID<K>>

export function getCurrentID<F>(M: FromReader<F> & Functor<F>): <K>() => HKT<F, ID<K>>

export function getCurrentID<F>(M: FromReader<F> & Functor<F>) {
  return <K>() => M.fromReader((env: CurrentID<K>) => env.currentID)
}

import {
  FromReader,
  FromReader2,
  FromReader3,
  FromReader3C,
  FromReader4,
} from 'fp-ts/dist/FromReader'
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { HKT, Kind2, Kind3, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Namespace } from './Namespace'

export interface CurrentNamespace<K extends PropertyKey = PropertyKey> {
  readonly currentNamespace: Namespace<K>
}

export function getCurrentNamespace<F extends URIS2>(
  M: FromReader2<F> & Functor2<F>,
): <K extends PropertyKey = PropertyKey>() => Kind2<F, CurrentNamespace<K>, Namespace<K>>

export function getCurrentNamespace<F extends URIS3>(
  M: FromReader3<F> & Functor3<F>,
): <K extends PropertyKey = PropertyKey, E = never>() => Kind3<
  F,
  CurrentNamespace<K>,
  E,
  Namespace<K>
>

export function getCurrentNamespace<F extends URIS3, E>(
  M: FromReader3C<F, E> & Functor3C<F, E>,
): <K extends PropertyKey = PropertyKey>() => Kind3<F, CurrentNamespace<K>, E, Namespace<K>>

export function getCurrentNamespace<F extends URIS4>(
  M: FromReader4<F> & Functor4<F>,
): <K extends PropertyKey = PropertyKey, E = never>() => Kind3<
  F,
  CurrentNamespace<K>,
  E,
  Namespace<K>
>

export function getCurrentNamespace<F>(
  M: FromReader<F> & Functor<F>,
): <K extends PropertyKey = PropertyKey>() => HKT<F, Namespace<K>>

export function getCurrentNamespace<F>(M: FromReader<F> & Functor<F>) {
  return <K extends PropertyKey = PropertyKey>() =>
    M.fromReader((env: CurrentNamespace<K>) => env.currentNamespace)
}

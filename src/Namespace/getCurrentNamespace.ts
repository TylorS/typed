import { Ask, Ask2, Ask2C, Ask3, Ask3C, asks } from '@typed/fp/Ask'
import { Functor, Functor2, Functor2C, Functor3, Functor3C } from 'fp-ts/dist/Functor'
import { HKT, Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { Namespace } from './Namespace'

export interface CurrentNamespace<K extends PropertyKey = PropertyKey> {
  readonly currentNamespace: Namespace<K>
}

export function getCurrentNamespace<F extends URIS2>(
  M: Ask2<F> & Functor2<F>,
): <K extends PropertyKey = PropertyKey>() => Kind2<F, CurrentNamespace<K>, Namespace<K>>

export function getCurrentNamespace<F extends URIS2, K extends PropertyKey = PropertyKey>(
  M: Ask2C<F, CurrentNamespace<K>> & Functor2C<F, CurrentNamespace<K>>,
): () => Kind2<F, CurrentNamespace<K>, Namespace<K>>

export function getCurrentNamespace<F extends URIS3>(
  M: Ask3<F> & Functor3<F>,
): <K extends PropertyKey = PropertyKey, E = never>() => Kind3<
  F,
  CurrentNamespace<K>,
  E,
  Namespace<K>
>

export function getCurrentNamespace<F extends URIS3, E>(
  M: Ask3C<F, E> & Functor3C<F, E>,
): <K extends PropertyKey = PropertyKey>() => Kind3<F, CurrentNamespace<K>, E, Namespace<K>>

export function getCurrentNamespace<F>(
  M: Ask<F> & Functor<F>,
): <K extends PropertyKey = PropertyKey>() => HKT<F, Namespace<K>>

export function getCurrentNamespace<F>(M: Ask<F> & Functor<F>) {
  const asks_ = asks(M)

  return <K extends PropertyKey = PropertyKey>() =>
    asks_((env: CurrentNamespace<K>) => env.currentNamespace)
}

import { deepEqualsEq } from '@typed/fp/Eq'
import { Eq } from 'fp-ts/dist/Eq'
import {
  FromReader,
  FromReader2,
  FromReader3,
  FromReader3C,
  FromReader4,
} from 'fp-ts/dist/FromReader'
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createShared } from './createShared'
import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export function fromKey<F extends URIS2>(
  M: FromReader2<F> & Functor2<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Shared2<F, K, Readonly<Record<K, A>>, A>

export function fromKey<F extends URIS3>(
  M: FromReader3<F> & Functor3<F>,
): <E, A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => Shared3<F, K, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS3, E>(
  M: FromReader3C<F, E> & Functor3C<F, E>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Shared3<F, K, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS4>(
  M: FromReader4<F> & Functor4<F>,
): <S, E, A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => Shared4<F, K, S, Readonly<Record<K, A>>, E, A>

export function fromKey<F>(
  M: FromReader<F> & Functor<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Shared<F, K, Readonly<Record<K, A>>, A>

export function fromKey<F>(M: FromReader<F> & Functor<F>) {
  const create = createShared<F>()

  return <A>(eq: Eq<A> = deepEqualsEq) => <K extends PropertyKey>(
    key: K,
  ): Shared<F, K, Readonly<Record<K, A>>, A> =>
    create(
      key,
      M.fromReader((e: Readonly<Record<K, A>>) => e[key]),
      eq,
    )
}

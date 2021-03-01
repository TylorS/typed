import { Ask, Ask2, Ask3, Ask3C, Ask4, Ask4C, asks } from '@typed/fp/Ask'
import { deepEqualsEq } from '@typed/fp/Eq'
import { Eq } from 'fp-ts/dist/Eq'
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createShared } from './createShared'
import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export function fromKey<F extends URIS2>(
  M: Ask2<F> & Functor2<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Shared2<F, K, Readonly<Record<K, A>>, A>

export function fromKey<F extends URIS3>(
  M: Ask3<F> & Functor3<F>,
): <E, A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => Shared3<F, K, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS3, E>(
  M: Ask3C<F, E> & Functor3C<F, E>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Shared3<F, K, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS4>(
  M: Ask4<F> & Functor4<F>,
): <S, E, A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => Shared4<F, K, S, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS4, E>(
  M: Ask4C<F, E> & Functor4<F>,
): <S, A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => Shared4<F, K, S, Readonly<Record<K, A>>, E, A>

export function fromKey<F>(
  M: Ask<F> & Functor<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Shared<F, K, A>

export function fromKey<F>(M: Ask<F> & Functor<F>) {
  const asksM = asks<F>(M)
  const create = createShared<F>()

  return <A>(eq: Eq<A> = deepEqualsEq) => <K extends PropertyKey>(key: K): Shared<F, K, A> =>
    create(
      key,
      asksM((e: Record<K, A>) => e[key]),
      eq,
    )
}

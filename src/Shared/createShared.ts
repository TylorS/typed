import { deepEqualsEq } from '@typed/fp/Eq'
import { Eq } from 'fp-ts/dist/Eq'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export function createShared<F extends URIS2>(): <K, E, A>(
  key: K,
  initial: Kind2<F, E, A>,
  eq?: Eq<A>,
) => Shared2<F, K, E, A>

export function createShared<F extends URIS2, E>(): <K, A>(
  key: K,
  initial: Kind2<F, E, A>,
  eq?: Eq<A>,
) => Shared2<F, K, E, A>

export function createShared<F extends URIS3>(): <K, R, E, A>(
  key: K,
  initial: Kind3<F, R, E, A>,
  eq?: Eq<A>,
) => Shared3<F, K, R, E, A>

export function createShared<F extends URIS3, E>(): <K, R, A>(
  key: K,
  initial: Kind3<F, R, E, A>,
  eq?: Eq<A>,
) => Shared3<F, K, R, E, A>

export function createShared<F extends URIS4>(): <K, S, R, E, A>(
  key: K,
  initial: Kind4<F, S, R, E, A>,
  eq?: Eq<A>,
) => Shared4<F, K, S, R, E, A>

export function createShared<F extends URIS4, E>(): <K, S, R, A>(
  key: K,
  initial: Kind4<F, S, R, E, A>,
  eq?: Eq<A>,
) => Shared4<F, K, S, R, E, A>

export function createShared<F>(): <K, A>(key: K, initial: HKT<F, A>, eq?: Eq<A>) => Shared<F, K, A>

export function createShared<F>() {
  return <K, A>(key: K, initial: HKT<F, A>, eq: Eq<A> = deepEqualsEq): Shared<F, K, A> => ({
    key,
    initial,
    ...eq,
  })
}

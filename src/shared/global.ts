import { Effect } from '@typed/fp/Effect/Effect'
import { curry } from '@typed/fp/lambda/exports'
import { flow, pipe } from 'fp-ts/lib/function'

import { deleteShared } from './deleteShared'
import { getShared } from './getShared'
import { EnvOf, Shared, ValueOf } from './Shared'
import { SharedEnv } from './SharedEnv'
import { updatedShared } from './updateShared'
import { usingNamespace } from './usingNamespace'
import { withShared } from './withShared'

/**
 * A namespace to be used as if it is global state.
 */
export const GLOBAL_NAMESPACE = Symbol.for('@typed/fp/Global')

/**
 * Helper for running effects within. the Global namespace. Can be
 * used to model singletons.
 */
export const usingGlobal = usingNamespace(GLOBAL_NAMESPACE)

export const getGlobal = flow(getShared, usingGlobal) as typeof getShared

export const updateGlobal = curry(
  <S extends Shared>(
    shared: S,
    update: (current: ValueOf<S>) => ValueOf<S>,
  ): Effect<SharedEnv & EnvOf<Shared>, ValueOf<S>> =>
    pipe(updatedShared(shared, update), usingGlobal),
) as typeof updatedShared

export const withGlobal = curry(
  <S extends Shared, E, A>(
    shared: S,
    f: (value: ValueOf<S>) => Effect<E, A>,
  ): Effect<E & SharedEnv & EnvOf<S>, A> => pipe(withShared(shared, f), usingGlobal),
) as typeof withShared

export const deleteGlobal = flow(deleteShared, usingGlobal) as typeof deleteShared

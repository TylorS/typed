import { Uuid } from '@typed/fp/Uuid/exports'
import { eqStrict } from 'fp-ts/Eq'
import { lookup } from 'fp-ts/Map'

import { INITIAL_ENV_INDEX } from './constants'

export const lookupByIndex = lookup(eqStrict)

export function getNextIndex(hookPositions: Map<Uuid, number>, id: Uuid) {
  if (!hookPositions.has(id)) {
    hookPositions.set(id, INITIAL_ENV_INDEX)
  }

  const index = hookPositions.get(id)!

  hookPositions.set(id, index + 1)

  return index
}

export function appendTo<K, A>(mapOfSets: Map<K, Set<A>>, key: K, value: A) {
  if (!mapOfSets.has(key)) {
    mapOfSets.set(key, new Set())
  }

  const channelConsumers = mapOfSets.get(key)!

  channelConsumers.add(value)
}

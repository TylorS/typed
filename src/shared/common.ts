import { deepEqualsEq } from '@typed/fp/common/exports'
import { eqStrict } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/Map'

export const strictMap = getEq(eqStrict, deepEqualsEq)

export function addToSet<A, B>(map: Map<A, Set<B>>, key: A, value: B) {
  if (!map.get(key)) {
    map.set(key, new Set())
  }

  const set = map.get(key)!

  set.add(value)
}

export function getOrCreate<A, B>(map: Map<A, B>, key: A, or: () => B): B {
  if (map.has(key)) {
    return map.get(key)!
  }

  return map.set(key, or()).get(key)!
}

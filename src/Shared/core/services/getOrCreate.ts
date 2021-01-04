import { doEffect, Effect } from '@fp/Effect/exports'

/**
 * Get the current value within a map or create the value. This allows for
 * a "just-in-time" computation of state.
 */
export const getOrCreate = <A, B, E>(
  map: Map<A, B>,
  key: A,
  or: () => Effect<E, B>,
): Effect<E, B> => {
  const eff = doEffect(function* () {
    if (map.has(key)) {
      return map.get(key)!
    }

    const value = yield* or()

    map.set(key, value)

    return value
  })

  return eff
}

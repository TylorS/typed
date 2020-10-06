/**
 * Attempts to retrieve an existing value from a Map. If the value is not
 * set it will create, set, and return that value.
 */
export const getOrSet = <A, B>(key: A, map: Map<A, B>, getValue: () => B): B => {
  return map.has(key) ? map.get(key)! : map.set(key, getValue()).get(key)!
}

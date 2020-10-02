export const getOrSet = <A, B>(key: A, map: Map<A, B>, getValue: () => B): B => {
  return map.has(key) ? map.get(key)! : map.set(key, getValue()).get(key)!
}

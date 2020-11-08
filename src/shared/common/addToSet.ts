export function addToSet<A, B>(map: Map<A, Set<B>>, key: A, value: B): boolean {
  if (!map.get(key)) {
    map.set(key, new Set())

    return false
  }

  const set = map.get(key)!

  set.add(value)

  return true
}

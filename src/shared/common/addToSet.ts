export function addToSet<A, B>(map: Map<A, Set<B>>, key: A, value: B) {
  if (!map.get(key)) {
    map.set(key, new Set())
  }

  const set = map.get(key)!

  set.add(value)
}

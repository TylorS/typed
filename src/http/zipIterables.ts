export function* zipIterables<A extends ReadonlyArray<Iterable<any>>>(
  ...iterables: A
): Generator<{ readonly [K in keyof A]: A[K] extends Iterable<infer R> ? R : never }, void> {
  const iterators = iterables.map((i) => i[Symbol.iterator]())

  let active = true
  loop: while (active) {
    const tuple = new Array(iterators.length)
    for (const idx of iterators.keys()) {
      const iter = iterators[idx]
      const cursor = iter.next()
      if (cursor.done) {
        active = false
        break loop
      }

      tuple[idx] = cursor.value
    }

    yield (tuple as unknown) as {
      readonly [K in keyof A]: A[K] extends Iterable<infer R> ? R : never
    }
  }
}

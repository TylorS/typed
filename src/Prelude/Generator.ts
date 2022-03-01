export interface Gen<Y, R, N = unknown> {
  readonly [Symbol.iterator]: () => Generator<Y, R, N>
}

export function Gen<Y, R, N>(f: () => Generator<Y, R, N>): Gen<Y, R, N> {
  return {
    [Symbol.iterator]: f,
  }
}

export function local<Y, Z>(f: (yielded: Y) => Z) {
  return <R, N>(gen: Gen<Y, R, N>): Gen<Z, R, N> => ({
    *[Symbol.iterator]() {
      const g = getGenerator(gen)
      let result = g.next()

      while (!result.done) {
        result = g.next(yield f(result.value))
      }

      return result.value
    },
  })
}

export const getGenerator = <Y, R, N>(gen: Gen<Y, R, N>) => gen[Symbol.iterator]()

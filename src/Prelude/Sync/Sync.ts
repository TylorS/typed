import * as F from '@/Prelude/function'
import { constant, flow } from '@/Prelude/function'

/**
 * Sync is a small wrapper around IO w/ Generators for
 * making it easier to use language features with IO such as
 * while-loops, for-loops, and stack-safe recursion.
 */
export interface Sync<A> {
  readonly [Symbol.iterator]: () => Generator<F.Lazy<any>, A>
}

export const Sync = <A>(f: () => Generator<F.Lazy<any>, A>): Sync<A> => ({
  [Symbol.iterator]: f,
})

export const fromLazy = <A>(lazy: F.Lazy<A>): Sync<A> =>
  Sync(function* () {
    return (yield lazy) as A
  })

export const of = flow(constant, fromLazy)

export const run = <A>(sync: Sync<A>): A => {
  const generator = sync[Symbol.iterator]()
  let result = generator.next()

  while (!result.done) {
    result = generator.next(result.value())
  }

  return result.value
}

export function forEach<A, B>(f: (value: A, index: number) => Sync<B>) {
  return (items: ReadonlyArray<A>): Sync<ReadonlyArray<B>> => {
    return Sync(function* () {
      const output: B[] = []

      for (let i = 0; i < items.length; ++i) {
        output.push(yield* f(items[i], i))
      }

      return output
    })
  }
}

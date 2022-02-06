import * as IO from '@/IO'

/**
 * Sync is a small wrapper around IO w/ Generators for
 * making it easier to use language features with IO such as
 * while-loops, for-loops, and stack-safe recursion.
 */
export interface Sync<A> {
  readonly [Symbol.iterator]: () => Generator<IO.IO<any>, A>
}

export const Sync = <A>(f: () => Generator<IO.IO<any>, A>): Sync<A> => ({
  [Symbol.iterator]: f,
})

export const fromIO = <A>(io: IO.IO<A>): Sync<A> =>
  Sync(function* () {
    return (yield io) as A
  })

export const of = <A>(value: A): Sync<A> => fromIO(() => value)

export const run = <A>(sync: Sync<A>): A => {
  const generator = sync[Symbol.iterator]()
  let result = generator.next()

  while (!result.done) {
    result = generator.next(result.value())
  }

  return result.value
}

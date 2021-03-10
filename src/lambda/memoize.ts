import { Eq, tuple } from 'fp-ts/dist/Eq'
import { identity, pipe } from 'fp-ts/dist/function'
import { match } from 'fp-ts/dist/Option'
import { lookup } from 'fp-ts/dist/ReadonlyMap'

export function memoize<A extends readonly any[]>(
  ...eqs: {
    readonly [K in keyof A]: Eq<A[K]>
  }
) {
  const keyEq = tuple(...eqs) as Eq<A>
  const get = lookup(keyEq)

  return <F extends (...args: A) => any>(f: F): F => {
    const memoized = new Map<A, ReturnType<F>>()

    return ((...args: A) => {
      return pipe(
        memoized,
        get(args),
        match(() => {
          const value = f(...args)

          memoized.set(args, value)

          return value
        }, identity),
      )
    }) as F
  }
}

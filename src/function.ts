import { Disposable } from '@most/types'
import { Eq, tuple } from 'fp-ts/Eq'
import { FunctionN, identity, pipe } from 'fp-ts/function'
import { match } from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

export type ArgsOf<A> = A extends FunctionN<infer R, any> ? R : never

export type Arity1<A, B> = FunctionN<[a: A], B>
export type Arity2<A, B, C> = FunctionN<[a: A, b: B], C>
export type Arity3<A, B, C, D> = FunctionN<[a: A, b: B, c: C], D>
export type Arity4<A, B, C, D, E> = FunctionN<[a: A, b: B, c: C, d: D], E>
export type Arity5<A, B, C, D, E, F> = FunctionN<[a: A, b: B, c: C, d: D, e: E], F>

export const memoize = <A extends readonly any[]>(
  ...eqs: { readonly [K in keyof A]: Eq<A[K]> }
) => <F extends (...args: A) => any>(f: F): F & Disposable => {
  const cache = new Map()
  const eq = tuple<A>(...eqs)
  const lookup = RM.lookup(eq)

  const memoized = (...args: A): ReturnType<F> =>
    pipe(
      cache,
      lookup(args),
      match(() => {
        const x = f(...args)

        cache.set(args, x)

        return x
      }, identity),
    )

  memoized.dispose = () => cache.clear()

  return memoized as F & Disposable
}

export * from 'fp-ts/function'

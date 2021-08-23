/**
 * @typed/fp/function is an extension to fp-ts/function
 *
 * @since 0.9.2
 */
import * as Eq from 'fp-ts/Eq'
import { FunctionN, identity, pipe } from 'fp-ts/function'
import { matchW } from 'fp-ts/Option'
import { lookup } from 'fp-ts/ReadonlyMap'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ArgsOf<A> = A extends FunctionN<infer R, any> ? R : never

/**
 * @since 0.9.2
 * @category Type-level
 */
export type AnyFn<R = any> = FunctionN<readonly any[], R>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity1<A, B> = FunctionN<[a: A], B>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity2<A, B, C> = FunctionN<[a: A, b: B], C>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity3<A, B, C, D> = FunctionN<[a: A, b: B, c: C], D>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity4<A, B, C, D, E> = FunctionN<[a: A, b: B, c: C, d: D], E>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity5<A, B, C, D, E, F> = FunctionN<[a: A, b: B, c: C, d: D, e: E], F>

/**
 * @since 0.15.0
 * @category Combinator
 */
export function memoize<A extends readonly any[]>(...eqs: { [K in keyof A]: Eq.Eq<A[K]> }) {
  const map = new Map<A, any>()
  const find_ = lookup(Eq.tuple(...eqs))
  const find = (k: A) => find_(k)(map)

  return <R>(f: (...args: A) => R) => {
    const memoized = (...args: A): R =>
      pipe(
        args,
        find,
        matchW(() => {
          const v = f(...args)

          map.set(args, v)

          return v
        }, identity),
      )

    memoized.name = `memoized(${f.name})`

    return memoized
  }
}

export * from 'fp-ts/function'

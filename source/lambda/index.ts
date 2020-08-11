import { ArgsOf, Arity1, Arity2, Arity3, Arity4, Arity5 } from '@typed/fp/common'
import { IO } from 'fp-ts/es6/IO'

/**
 * Allow a fixed length function to be partially applied.
 * @param f Function you'd like to curry
 */
export const curry = <F extends Fn>(f: F): Curry<F> => {
  return curriedN(f.length, f, []) as Curry<F>
}

function curriedN<Args extends unknown[], R>(
  arity: number,
  f: Fn<Args, R>,
  previousArgs: unknown[],
): unknown {
  if (arity < 2) {
    return f
  }

  return (...args: unknown[]) => {
    const concatArgs = previousArgs.concat(args) as Args

    return concatArgs.length >= arity ? f(...concatArgs) : curriedN(arity, f, concatArgs)
  }
}

export type Fn<Args extends readonly unknown[] = readonly unknown[], R = unknown> = (
  ...args: Args
) => R

export interface Curry2<A, B, C> extends Arity2<A, B, C>, Arity1<A, Arity1<B, C>> {}

export interface Curry3<A, B, C, D>
  extends Arity3<A, B, C, D>,
    Arity2<A, B, Arity1<C, D>>,
    Arity1<A, Curry2<B, C, D>> {}

export interface Curry4<A, B, C, D, E>
  extends Arity4<A, B, C, D, E>,
    Arity3<A, B, C, Arity1<D, E>>,
    Arity2<A, B, Curry2<C, D, E>>,
    Arity1<A, Curry3<B, C, D, E>> {}

export interface Curry5<A, B, C, D, E, F>
  extends Arity5<A, B, C, D, E, F>,
    Arity4<A, B, C, D, Arity1<E, F>>,
    Arity3<A, B, C, Curry2<D, E, F>>,
    Arity2<A, B, Curry3<C, D, E, F>>,
    Arity1<A, Curry4<B, C, D, E, F>> {}

export type Curry<T extends Fn> = ArgsOf<T> extends [infer A]
  ? Arity1<A, ReturnType<T>>
  : ArgsOf<T> extends [infer A, infer B]
  ? Curry2<A, B, ReturnType<T>>
  : ArgsOf<T> extends [infer A, infer B, infer C]
  ? Curry3<A, B, C, ReturnType<T>>
  : ArgsOf<T> extends [infer A, infer B, infer C, infer D]
  ? Curry4<A, B, C, D, ReturnType<T>>
  : ArgsOf<T> extends [infer A, infer B, infer C, infer D, infer E]
  ? Curry5<A, B, C, D, E, ReturnType<T>>
  : ArgsOf<T> extends never[]
  ? IO<ReturnType<T>>
  : never

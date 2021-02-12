import { FunctionN } from 'fp-ts/function'

export type Uncurry<
  F extends FunctionN<any, any>,
  Args extends readonly any[] = []
> = F extends FunctionN<infer A, FunctionN<infer B, infer C>>
  ? Uncurry<FunctionN<B, C>, [...Args, ...A]>
  : F extends FunctionN<infer A, infer R>
  ? FunctionN<[...Args, ...A], R>
  : F

export const uncurry = <F extends FunctionN<any, any>>(f: F): Uncurry<F> => uncurry_(f)

function uncurry_<F extends FunctionN<any, any>>(f: F) {
  function uncurried(...args: readonly any[]) {
    let x = f

    for (let i = 0; i < args.length; ) {
      const input = args.slice(i, i + x.length)

      x = x(...input)
      i += input.length
    }

    return x
  }

  return uncurried as Uncurry<F>
}

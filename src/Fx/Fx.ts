import { constant, flow, FunctionN } from 'fp-ts/function'

import { Instruction } from './Instruction'

export interface Fx<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Instruction<R, E, any>, A>
}

export type RequirementsOf<T> = FxOf<T> extends Fx<infer R, any, any> ? R : never

export type ErrorOf<T> = FxOf<T> extends Fx<any, infer R, any> ? R : never

export type ValueOf<T> = FxOf<T> extends Fx<any, any, infer R> ? R : never

export function Fx<F extends () => Generator<Instruction<any, any, any>, any>>(f: F): FxOf<F> {
  return {
    [Symbol.iterator]: f,
  } as unknown as FxOf<F>
}

export interface RFx<R, A> extends Fx<R, never, A> {}

export interface EFx<E, A> extends Fx<unknown, E, A> {}

export interface Pure<A> extends Fx<unknown, never, A> {}

export type FxOf<A> = A extends Fx<infer R, infer E, infer A>
  ? Fx<R, E, A>
  : A extends FunctionN<readonly any[], infer R>
  ? FxOf<R>
  : never

export function map<A, B>(f: (value: A) => B) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, B> =>
    Fx(function* () {
      return f(yield* fx)
    })
}

export const mapTo = flow(constant, map)

export function chain<A, R2, E2, B>(f: (value: A) => Fx<R2, E2, B>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R & R2, E | E2, B> =>
    Fx(function* () {
      return yield* f(yield* fx)
    })
}

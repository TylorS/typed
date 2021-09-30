import { Instruction } from './Instruction'

export interface Fx<R, A> {
  readonly [Symbol.iterator]: () => Generator<Instruction<R, any>, A>
}

export type Of<A> = Fx<unknown, A>

export type RequirementsOf<T> = FxOf<T> extends Fx<infer R, any> ? R : unknown

export type OutputOf<T> = FxOf<T> extends Fx<any, infer A> ? A : never

export type FxOf<G> = G extends Fx<infer R, infer A>
  ? Fx<R, A>
  : G extends (...args: readonly any[]) => infer R
  ? FxOf<R>
  : never

export function Fx<G extends Generator<Instruction<any, any>, any>>(
  generatorFunction: () => G,
): FxOf<G> {
  return {
    [Symbol.iterator]: generatorFunction,
  } as unknown as FxOf<G>
}

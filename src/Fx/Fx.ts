import type { Effect } from '@/Effect'
import type { Instruction } from '@/Fiber/Instruction'

export interface Fx<R, A> extends Effect<Instruction<R, any>, A, any> {}

export type RequirementsOf<T> = T extends Fx<infer R, any> ? R : never

export type OutputOf<T> = T extends Fx<any, infer R> ? R : never

export interface Of<A> extends Fx<unknown, A> {}

export const Fx = <G extends Generator<Instruction<any, any>, any, any>>(g: () => G): FxFrom<G> =>
  ({
    [Symbol.iterator]: g,
  } as unknown as FxFrom<G>)

export type FxFrom<T> = T extends Fx<infer R, infer A>
  ? Fx<R, A>
  : T extends (...args: readonly any[]) => infer R
  ? FxFrom<R>
  : never

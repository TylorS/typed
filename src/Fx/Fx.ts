import { Effect, ErrorOf, ResourcesOf } from '@/Effect'

export interface Fx<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Effect<R, E, any>, A>
}

export interface RFx<R, A> extends Fx<R, never, A> {}
export interface EFx<E, A> extends Fx<unknown, E, A> {}
export interface Of<A> extends Fx<unknown, never, A> {}

export function Fx<G extends Generator<any, any, any> | Generator<never, any, any>>(
  f: () => G,
): Fx<FxResources<G>, FxError<G>, FxOutput<G>> {
  return {
    [Symbol.iterator]: f,
  } as const
}

export type FxResources<T> = [T] extends [Generator<infer Y, any, any>] ? ResourcesOf<Y> : unknown

export type FxError<T> = [T] extends [Generator<infer Y, any, any>] ? ErrorOf<Y> : never

export type FxOutput<T> = [T] extends [Generator<any, infer R, any>] ? R : never

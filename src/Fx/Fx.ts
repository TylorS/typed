import type * as Effect from '@/Effect'

export interface Fx<R, E, A> extends Effect.Effect<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Effect.Effect<R, E, any>, A>
}

export type ResourcesOf<T> = [T] extends [Fx<infer R, infer _, infer __>] ? R : unknown
export type ErrorOf<T> = [T] extends [Fx<infer _, infer R, infer __>] ? R : unknown
export type OutputOf<T> = [T] extends [Fx<infer _, infer __, infer R>] ? R : unknown

export interface RFx<R, A> extends Fx<R, never, A> {}
export interface EFx<E, A> extends Fx<unknown, E, A> {}
export interface Of<A> extends Fx<unknown, never, A> {}

export function Fx<
  G extends
    | Generator<any, any, any>
    | Generator<never, any, any>
    | Generator<any, never, any>
    | Generator<never, never, any>
    | Generator<never, never, never>,
>(f: () => G): Fx<GeneratoResouces<G>, GeneratorError<G>, GeneratorOutput<G>> {
  return {
    [Symbol.iterator]: f,
  } as unknown as Fx<GeneratoResouces<G>, GeneratorError<G>, GeneratorOutput<G>>
}

export type GeneratoResouces<T> = [T] extends [Generator<infer Y, infer _, infer _>]
  ? Effect.ResourcesOf<Y>
  : unknown

export type GeneratorError<T> = [T] extends [Generator<infer Y, infer _, infer _>]
  ? Effect.ErrorOf<Y>
  : never

export type GeneratorOutput<T> = [T] extends [Generator<infer _, infer R, infer _>] ? R : never

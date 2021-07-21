import { unsafeCoerce } from './function'

export type BrandOf<A> = A extends Branded<infer _, infer R> ? R : never
export type ValueOf<A> = A extends infer E & { readonly __brand__?: BrandOf<A> } ? E : never

export type Branded<E, A> = E & { readonly __brand__?: A }
export const Branded =
  <A extends Branded<any, any>>() =>
  <E extends ValueOf<A>>(e: E): Branded<E, BrandOf<A>> =>
    unsafeCoerce(e)

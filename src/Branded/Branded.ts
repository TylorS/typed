/**
 * Branded is a module to help you construct Branded types.

 */
import { unsafeCoerce } from '@/function'

/**
 * @category Type-level
 */
export type BrandOf<A> = A extends Branded<infer _, infer R> ? R : never

/**
 * @category Type-level
 */
export type ValueOf<A> = A extends infer E & { readonly __brand__: BrandOf<A> } ? E : never

/**
 * @category Model
 */
export type Branded<T, Brand> = T & { readonly __brand__: Brand }

/**
 * @category Constructor
 */
export const Branded =
  <A extends Branded<any, any>>() =>
  <E extends ValueOf<A>>(e: E): Branded<E, BrandOf<A>> =>
    unsafeCoerce(e)

export const brand: <A extends Branded<any, any>>(value: ValueOf<A>) => A = unsafeCoerce

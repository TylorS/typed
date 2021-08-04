/**
 * Branded is a module to help you construct Branded types.
 *
 * @since 0.9.2
 */
import { unsafeCoerce } from './function'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type BrandOf<A> = A extends Branded<infer _, infer R> ? R : never

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ValueOf<A> = A extends infer E & { readonly __brand__?: BrandOf<A> } ? E : never

/**
 * @since 0.9.2
 * @category Model
 */
export type Branded<E, A> = E & { readonly __brand__: A }

/**
 * @since 0.9.2
 * @category Constructor
 */
export const Branded =
  <A extends Branded<any, any>>() =>
  <E extends ValueOf<A>>(e: E): Branded<E, BrandOf<A>> =>
    unsafeCoerce(e)

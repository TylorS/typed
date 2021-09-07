/**
 * Branded is a module to help you construct Branded types.
 */
import { unsafeCoerce } from 'fp-ts/function'

/**
 * @category Type-level
 */
export type BrandOf<A> = '__brand__' extends keyof A ? A['__brand__'] : never

/**
 * @category Type-level
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ValueOf<A> = A extends Branded<infer T, BrandOf<A>> ? T : never

/**
 * @category Model
 */
export type Branded<T, Brand> = T & { readonly __brand__: Brand }

/**
 * @category Constructor
 */
export const Branded =
  <B extends Branded<any, any>>() =>
  <T extends ValueOf<B>>(e: T): Branded<T, BrandOf<B>> =>
    unsafeCoerce(e)

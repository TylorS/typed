import { unsafeCoerce } from 'fp-ts/dist/function'

/**
 * Construct a branded type. It remains compatible with the underlying type A, but
 * is given additional structure to differentiate this A from other As.
 */
export type Branded<Brand, A> = A & { __brand__: Brand }

/**
 * A curried functon for helping to construct certain kinds of brands
 */
export const Branded = <B extends Branded<unknown, unknown>>() => <A extends BrandValue<B>>(
  value: A,
): Branded<BrandOf<B>, A> => brand<B, A>(value)

/**
 * Extract the Brand of a given Branded Type
 */
export type BrandOf<A> = A extends Branded<infer R, unknown> ? R : never

/**
 * Extract the underlying value of a Branded type.
 */
export type BrandValue<A> = [A] extends [Branded<BrandOf<A>, infer R>] ? R : never

/**
 * Construct a branded type.
 */
export const brand: <B extends Branded<unknown, unknown>, A extends BrandValue<B> = BrandValue<B>>(
  value: A,
) => Branded<BrandOf<B>, A> = unsafeCoerce

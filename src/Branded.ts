import { Eq } from 'fp-ts/Eq'
import { constant, unsafeCoerce } from 'fp-ts/function'
import { Ord } from 'fp-ts/Ord'

/**
 * Construct a branded type. It remains compatible with the underlying type A, but
 * is given additional structure to differentiate this A from other As.
 */
export type Branded<Brand, A> = A & { readonly __brand__: Brand }

/**
 * A curried functon for helping to construct certain kinds of brands
 */
export const Branded: <B extends Branded<any, any>>() => <A extends BrandValue<B>>(
  value: A,
) => Branded<BrandOf<B>, A> = constant(unsafeCoerce)

/**
 * Extract the Brand of a given Branded Type
 */
export type BrandOf<A> = A extends Branded<infer R, unknown> ? R : never

/**
 * Extract the underlying value of a Branded type.
 */
export type BrandValue<A> = A extends Branded<BrandOf<A>, infer R> ? R : never

/**
 * Construct a branded type.
 */
export const brand: <B extends Branded<any, any>>(value: BrandValue<B>) => B = unsafeCoerce

export const getEq = <A extends Branded<any, any>>(eq: Eq<BrandValue<A>>): Eq<A> => eq as Eq<A>

export const getOrd = <A extends Branded<any, any>>(ord: Ord<BrandValue<A>>): Ord<A> =>
  ord as Ord<A>

/**
 * Include only values of `A` that extend some type of `B`.
 * @example
 * Include<1 | 2 | 3, 2> === 2
 */
export type Include<A, B> = A extends B ? A : never

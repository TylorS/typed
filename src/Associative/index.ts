/**
 * Associative<A> describes a way of combining two values of type A that is associative.
 */
export interface Associative<A> {
  readonly combine: (left: A, right: A) => A
}

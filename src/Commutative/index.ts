import { Associative } from '@/Associative'

/**
 * Commutative<A> describes a way of combining two values of type A that is associative and commutative.
 */
export interface Commutative<A> extends Associative<A> {}

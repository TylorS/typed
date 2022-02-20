import { concatAll } from '../Associative'

export interface Commutative<A> {
  readonly commute: (second: A) => (first: A) => A
}

export const commuteAll = <A>(C: Commutative<A>): ((startWith: A) => (as: readonly A[]) => A) =>
  concatAll({ associative: C.commute })

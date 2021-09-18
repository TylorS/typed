export interface Ord<A> {
  readonly compare: (left: A, right: A) => Ordering
}

export type Ordering = -1 | 0 | 1

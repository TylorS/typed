import deepEquals from 'fast-deep-equal'

export interface Eq<A> {
  readonly equals: (second: A) => (first: A) => boolean
}

export const DeepEquals: Eq<unknown> = {
  equals: (second) => (first) => deepEquals(first, second),
}

export interface Eq<A> {
  readonly equals: (second: A) => (first: A) => boolean
}

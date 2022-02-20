export interface Associative<A> {
  readonly associative: (second: A) => (first: A) => A
}

export const Associative = <A>(associative: (x: A, y: A) => A): Associative<A> => ({
  associative: (s) => (f) => associative(f, s),
})

export const concatAll =
  <A>(A: Associative<A>) =>
  (startWith: A) =>
  (values: readonly A[]): A =>
    values.reduce((a, b) => A.associative(b)(a), startWith)

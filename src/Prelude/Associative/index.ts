export interface Associative<A> {
  readonly associative: (x: A, y: A) => A
}

export const Associative = <A>(associative: (x: A, y: A) => A): Associative<A> => ({
  associative,
})

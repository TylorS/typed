export type Tuple<A, B = A> = readonly [A, B]

export function isTuple<A>(array: readonly A[]): array is Tuple<A> {
  return array.length === 2
}

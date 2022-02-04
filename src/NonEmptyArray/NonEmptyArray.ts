export type NonEmptyArray<A> = readonly [A, ...A[]]

export const isNonEmpty = <A>(array: ReadonlyArray<A>): array is NonEmptyArray<A> =>
  array.length > 0

export function isEmpty<A>(array: Array<A>): array is Array<A>
export function isEmpty<A>(array: ReadonlyArray<A>): array is ReadonlyArray<A>
export function isEmpty<A>(array: ReadonlyArray<A>): array is ReadonlyArray<A> {
  return array.length === 0
}

export const of = <A>(value: A): NonEmptyArray<A> => [value]

export const map =
  <A, B>(f: (a: A) => B) =>
  (nea: NonEmptyArray<A>): NonEmptyArray<B> => {
    const [first, ...rest] = nea

    return [f(first), ...rest.map(f)]
  }

export const mapWithIndex =
  <A, B>(f: (a: A, index: number) => B) =>
  (nea: NonEmptyArray<A>): NonEmptyArray<B> => {
    const [first, ...rest] = nea

    return [f(first, 0), ...rest.map((a, i) => f(a, i + 1))]
  }

export const append =
  <A>(value: A) =>
  (nea: NonEmptyArray<A>): NonEmptyArray<A> =>
    [...nea, value]

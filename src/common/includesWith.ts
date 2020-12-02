/**
 * Checks to see if a list contains a value passing an additional
 * value to the predicate.
 */
export function includesWith<A, B>(
  pred: (value: A, item: B, index: number) => boolean,
  x: A,
  list: B[],
): boolean {
  let idx = 0
  const len = list.length

  while (idx < len) {
    if (pred(x, list[idx], idx)) {
      return true
    }
    idx += 1
  }
  return false
}

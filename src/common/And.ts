/**
 * Convert a n-ary tuple of values into an intersection of all of those values. If
 * the tuple is empty the fallback value, defaulting to `unknown`, will be used.
 * @example
 * And<[{ a: 1 }, { b: 2 }]> = { a: 1 } & { b: 2 }
 * And<[]> = unknown
 * And<[], { foo: string }> = { foo: string }
 */
export type And<A extends ReadonlyArray<any>, R = unknown> = A extends readonly [
  infer T,
  ...infer Rest
]
  ? And<Rest, R & T>
  : A extends readonly [infer T]
  ? R & T
  : R

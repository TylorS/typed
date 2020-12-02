/**
 * Convert a List of values into a union of those values.
 * @example
 * Or<[1, 2, 3]> === 1 | 2 | 3
 */
export type Or<A extends readonly any[]> = A[number]

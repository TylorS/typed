export function deepStrictEqual<T>(actual: unknown, expected: T): asserts actual is T {
  expect(actual).toEqual(expected)
}

export function ok<T>(actual: T): asserts actual {
  expect(actual).toBe(true)
}

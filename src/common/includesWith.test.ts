import { describe, given, it, Test } from '@typed/test'

import { includesWith } from './includesWith'

export const test: Test = describe(`includesWith`, [
  given(`a predicate, a value, and a list`, [
    it(`calls the predicate function with the given value and each element of the list`, ({
      same,
    }) => {
      const expectedValue = 1
      const list: string[] = ['foo', 'bar', 'baz']
      const predicate = (value: number, item: string, index: number) =>
        !!same(expectedValue, value) && !!same(list[index], item)

      includesWith(predicate, expectedValue, list)
    }),
  ]),
])

import { describe, given, it, Test } from '@typed/test'

import { functionName } from './functionName'

export const test: Test = describe(`functionName`, [
  given(`a function`, [
    it(`returns the function name`, ({ equal }) => {
      const expected = `exampleFunctionName`
      const actual = functionName(exampleFunctionName)

      equal(expected, actual)
    }),
  ]),
])

function exampleFunctionName() {
  return null
}

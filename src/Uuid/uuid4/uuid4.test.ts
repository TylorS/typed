import { Uuid, UuidSeed } from '@typed/fp/types'
import { describe, given, it, Test } from '@typed/test'

import { uuid4 } from './uuid4'

export const test: Test = describe(`uuid4`, [
  given(`[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]`, [
    it(`returns`, ({ equal }) => {
      const expected = '1234-56-478-89a-bcdef10' as Uuid

      equal(expected, uuid4(createUuidArray()))
    }),
  ]),
])

function createUuidArray(): UuidSeed {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as UuidSeed
}

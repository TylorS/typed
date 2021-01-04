import { VALID_UUID_LENGTH } from '@fp/Uuid/exports'
import { describe, it } from '@typed/test'

import { uuidEnv } from './UuidEnv'

export const test = describe(`browser/UuidEnv`, [
  describe(`randomUuidSeed`, [
    it(`returns UuidSeed`, ({ equal }) => {
      const seed = uuidEnv.randomUuidSeed()

      equal(VALID_UUID_LENGTH, seed.length)
    }),
  ]),
])

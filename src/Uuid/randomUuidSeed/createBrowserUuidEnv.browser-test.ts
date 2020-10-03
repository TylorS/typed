import { describe, it } from '@typed/test'

import { VALID_UUID_LENGTH } from './constants'
import { createBrowserUuidEnv } from './createBrowserUuidEnv'

export const test = describe(`createBrowserUuidEnv`, [
  describe(`randomUuidSeed`, [
    it(`returns UuidSeed`, ({ equal }) => {
      const env = createBrowserUuidEnv()
      const seed = env.randomUuidSeed()

      equal(VALID_UUID_LENGTH, seed.length)
    }),
  ]),
])

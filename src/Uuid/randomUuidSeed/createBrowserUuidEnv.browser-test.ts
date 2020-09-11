import { disposeNone } from '@most/disposable'
import { runPure } from '@typed/fp/Effect/exports'
import { describe, it } from '@typed/test'

import { VALID_UUID_LENGTH } from './constants'
import { createBrowserUuidEnv } from './createBrowserUuidEnv'

export const test = describe(`createBrowserUuidEnv`, [
  describe(`randomUuidSeed`, [
    it(`returns UuidSeed`, ({ equal }) => {
      const env = createBrowserUuidEnv()

      runPure((seed) => {
        equal(VALID_UUID_LENGTH, seed.length)

        return disposeNone()
      }, env.randomUuidSeed())
    }),
  ]),
])

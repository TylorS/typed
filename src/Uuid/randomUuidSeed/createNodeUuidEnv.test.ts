import { disposeNone } from '@most/disposable'
import { runPure } from '@typed/fp/Effect/exports'
import { describe, it } from '@typed/test'

import { createNodeUuidEnv } from './createNodeUuidEnv'

export const test = describe(`createNodeUuidEnv`, [
  describe(`randomUuidSeed`, [
    it(`returns UuidSeed`, ({ equal }, done) => {
      const generator = createNodeUuidEnv()

      runPure((seed) => {
        try {
          equal(16, seed.length)

          done()
        } catch (error) {
          done(error)
        }

        return disposeNone()
      }, generator.randomUuidSeed())
    }),
  ]),
])

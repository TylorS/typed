import { disposeNone } from '@most/disposable'
import { describe, it } from '@typed/test'
import { runEffect } from '../../Effect'
import { createNodeUuidEnv } from './createNodeUuidEnv'

export const test = describe(`createNodeUuidEnv`, [
  describe(`randomUuidSeed`, [
    it(`returns UuidSeed`, ({ equal }, done) => {
      const generator = createNodeUuidEnv()

      runEffect((seed) => {
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

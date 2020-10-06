import { describe, it } from '@typed/test'

import { createNodeUuidEnv } from './createNodeUuidEnv'

export const test = describe(`createNodeUuidEnv`, [
  describe(`randomUuidSeed`, [
    it(`returns UuidSeed`, ({ equal }) => {
      const { randomUuidSeed } = createNodeUuidEnv()

      equal(16, randomUuidSeed().length)
    }),
  ]),
])

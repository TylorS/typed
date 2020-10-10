import { UuidEnv } from '../common'
import { VALID_UUID_LENGTH } from './constants'

export function createNodeUuidEnv(): UuidEnv {
  return {
    randomUuidSeed: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { randomBytes } = require('crypto')

      const { data } = randomBytes(VALID_UUID_LENGTH).toJSON()
      const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = data

      return [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] as const
    },
  }
}

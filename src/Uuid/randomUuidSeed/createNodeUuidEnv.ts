import { doEffect, fromTask, memo } from '@typed/fp/Effect/exports'

import { UuidEnv } from '../common'
import { VALID_UUID_LENGTH } from './constants'

/**
 * @since 0.0.1
 */
export function createNodeUuidEnv(): UuidEnv {
  const getModule = memo(fromTask(() => import('crypto')))

  return {
    randomUuidSeed: () =>
      doEffect(function* () {
        const { randomBytes } = yield* getModule

        const { data } = randomBytes(VALID_UUID_LENGTH).toJSON()
        const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = data

        return [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] as const
      }),
  }
}

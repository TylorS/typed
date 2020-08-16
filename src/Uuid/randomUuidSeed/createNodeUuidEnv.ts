import { fromPromise } from '@typed/fp/Effect'

import { UuidEnv, UuidSeed } from '../common'
import { VALID_UUID_LENGTH } from './constants'

/**
 * @since 0.0.1
 */
export function createNodeUuidEnv(): UuidEnv {
  return {
    randomUuidSeed: () =>
      fromPromise<UuidSeed>(() =>
        import('crypto').then((c) => {
          const { data } = c.randomBytes(VALID_UUID_LENGTH).toJSON()

          return data as any
        }),
      ),
  }
}

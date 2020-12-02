import { randomBytes } from 'crypto'

import { Provider, provideSome } from '../Effect/provide'
import { UuidEnv, VALID_UUID_LENGTH } from '../Uuid/exports'

/**
 * A node-specific implementation of UuidEnv
 */
export const uuidEnv: UuidEnv = {
  randomUuidSeed: () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires

    const { data } = randomBytes(VALID_UUID_LENGTH).toJSON()
    const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = data

    return [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] as const
  },
}

export const provideUuidEnv: Provider<UuidEnv> = provideSome(uuidEnv)

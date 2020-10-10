import { UuidEnv, UuidSeed } from '../common'
import { VALID_UUID_LENGTH } from './constants'

export function createBrowserUuidEnv(): UuidEnv {
  return {
    randomUuidSeed: () =>
      (Array.from(
        crypto.getRandomValues(new Uint8Array(VALID_UUID_LENGTH)),
      ) as unknown) as UuidSeed,
  }
}

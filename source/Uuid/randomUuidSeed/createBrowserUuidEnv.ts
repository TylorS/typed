import { of } from '@typed/fp/Effect'
import { UuidEnv } from '../common'
import { VALID_UUID_LENGTH } from './constants'

export function createBrowserUuidEnv(): UuidEnv {
  return {
    randomUuidSeed: () =>
      of(Array.from(crypto.getRandomValues(new Uint8Array(VALID_UUID_LENGTH))) as any),
  }
}

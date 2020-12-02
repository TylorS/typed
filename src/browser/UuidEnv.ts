import { Provider, provideSome } from '@typed/fp/Effect/exports'
import { UuidEnv, UuidSeed, VALID_UUID_LENGTH } from '@typed/fp/Uuid/exports'

/**
 * Browser implementation of UuidEnv using native WebCrypto API to retrieve cryptographically-safe
 * random numbers to generate real UUIDs in the browser.
 */
export const uuidEnv: UuidEnv = {
  randomUuidSeed: () =>
    (Array.from(crypto.getRandomValues(new Uint8Array(VALID_UUID_LENGTH))) as unknown) as UuidSeed,
}

/**
 * Provide an Effect with a UuidEnv using WebCrypto.
 */
export const provideUuidEnv: Provider<UuidEnv> = provideSome(uuidEnv)

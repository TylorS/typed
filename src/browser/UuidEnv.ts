import { Provider, provideSome } from '@typed/fp/Effect/exports'
import { UuidEnv, UuidSeed, VALID_UUID_LENGTH } from '@typed/fp/Uuid/exports'

export const uuidEnv: UuidEnv = {
  randomUuidSeed: () =>
    (Array.from(crypto.getRandomValues(new Uint8Array(VALID_UUID_LENGTH))) as unknown) as UuidSeed,
}

export const provideUuidEnv: Provider<UuidEnv> = provideSome(uuidEnv)

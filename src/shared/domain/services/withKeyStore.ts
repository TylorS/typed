import { doEffect, EffectGenerator, EffectOf } from '@typed/fp/Effect/exports'

import { SharedKeyStore } from '../exports'
import { getKeyStore } from './getKeyStore'

/**
 * Perform some effect with the current key store
 */
export function withKeyStore<F extends (keyStore: SharedKeyStore) => EffectGenerator<any, any>>(
  f: F,
): EffectOf<F> {
  const eff = doEffect(function* () {
    const keyStore = yield* getKeyStore

    return yield* f(keyStore)
  })

  return eff as EffectOf<F>
}

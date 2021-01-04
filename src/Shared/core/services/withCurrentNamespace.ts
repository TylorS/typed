import { doEffect, Effect, EffectGenerator } from '@fp/Effect/exports'

import { Namespace } from '../model/exports'
import { CurrentNamespaceEnv } from './CurrentNamespaceEnv'
import { getCurrentNamespace } from './getCurrentNamespace'

/**
 * Run an effect using the current namespace
 */
export const withCurrentNamespace = <E, A>(
  f: (namespace: Namespace) => EffectGenerator<E, A>,
): Effect<CurrentNamespaceEnv & E, A> => {
  const eff = doEffect(function* () {
    return yield* f(yield* getCurrentNamespace)
  })

  return eff
}

import { doEffect, EffectGenerator } from '@typed/fp/Effect/exports'

import { Namespace } from '../model/exports'
import { getCurrentNamespace } from './getCurrentNamespace'

/**
 * Run an effect using the current namespace
 */
export const withCurrentNamespace = <E, A>(f: (namespace: Namespace) => EffectGenerator<E, A>) => {
  const eff = doEffect(function* () {
    return yield* f(yield* getCurrentNamespace)
  })

  return eff
}

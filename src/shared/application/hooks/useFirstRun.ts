import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { SharedEnv } from '@typed/fp/Shared/domain/exports'

import { useRef } from './useRef'

const pureTrue = Pure.of(true)

/**
 * Track if it's the first time running in this namespace.
 */
export const useFirstRun: Effect<SharedEnv, boolean> = doEffect(function* () {
  const ref = yield* useRef(pureTrue)

  if (ref.current) {
    ref.current = false

    return true
  }

  return ref.current
})

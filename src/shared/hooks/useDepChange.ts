import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { SharedEnv } from '@typed/fp/Shared/core/exports'
import { Eq } from 'fp-ts/Eq'

import { useFirstRun } from './useFirstRun'
import { useRef } from './useRef'

/**
 * Track if a value has changed
 */
export const useDepChange = <A>(value: A, eq: Eq<A>, first = true): Effect<SharedEnv, boolean> => {
  const eff = doEffect(function* () {
    const firstRun = yield* useFirstRun
    const previous = yield* useRef(Pure.of(value))

    if (firstRun) {
      return first
    }

    const changed = !eq.equals(previous.current, value)

    if (changed) {
      previous.current = value
    }

    return changed
  })

  return eff
}

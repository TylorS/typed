import { doEffect } from '@fp/Effect/exports'
import { filter } from '@most/core'
import { Guard } from 'io-ts/Guard'

import { getSharedEvents, SharedEvent } from '../core/events/exports'
import { useMemo } from './useMemo'
import { useStream } from './useStream'

/**
 * Listen to Shared events that match a Guard instance.
 */
export const listenToSharedEvent = <A extends SharedEvent>(
  guard: Guard<unknown, A>,
  onEvent: (value: A) => void,
) => {
  const eff = doEffect(function* () {
    const events = yield* getSharedEvents
    const filtered = yield* useMemo(() => filter(guard.is, events), [guard, events])

    return yield* useStream(filtered, onEvent)
  })

  return eff
}

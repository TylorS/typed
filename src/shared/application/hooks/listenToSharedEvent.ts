import { filter } from '@most/core'
import { doEffect } from '@typed/fp/Effect/exports'
import { Guard } from 'io-ts/Guard'

import { getSharedEvents, SharedEvent } from '../../domain/exports'
import { useMemo } from './useMemo'
import { useStream } from './useStream'

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

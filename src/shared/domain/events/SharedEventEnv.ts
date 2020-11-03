import { Adapter } from '@most/adapter'
import { Stream } from '@most/types'
import { ap, asks, Effect, Pure } from '@typed/fp/Effect/exports'

import { SharedEvent } from './SharedEvent'

export interface SharedEventEnv extends Record<'sharedEvents', Adapter<SharedEvent, SharedEvent>> {}

export const getSharedEvents: Effect<SharedEventEnv, Stream<SharedEvent>> = asks(
  (e: SharedEventEnv) => e.sharedEvents[1],
)

export const getSendSharedEvent: Effect<SharedEventEnv, (event: SharedEvent) => void> = asks(
  (e: SharedEventEnv) => e.sharedEvents[0],
)

export const sendSharedEvent = (event: SharedEvent): Effect<SharedEventEnv, void> =>
  ap(getSendSharedEvent, Pure.of(event))

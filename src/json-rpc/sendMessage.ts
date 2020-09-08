import { Sink } from '@most/types'
import { ask, doEffect } from '@typed/fp/Effect'

import { SchedulerEnv } from '@typed/fp/fibers'
import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'

export const sendMessage = (message: JsonRpc.Message, direction: MessageDirection) =>
  doEffect(function* () {
    const { connection } = yield* ask<ConnectionEnv & SchedulerEnv>()
    const [sink] = connection[direction]

    yield* sendEvent(sink, message)
  })

const sendEvent = <A>(sink: Sink<A>, value: A) =>
  doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()

    sink.event(scheduler.currentTime(), value)
  })

import { doEffect, Effect, zip } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
import { oppositeDirection } from './oppositeDirection'
import { sendMessage } from './sendMessage'
import { waitForResponse } from './waitForResponse'

export const sendRequest = <A extends JsonRpc.Request, B extends JsonRpc.Response>(
  request: A,
  direction: MessageDirection,
): Effect<ConnectionEnv & SchedulerEnv, B> => {
  const eff = doEffect(function* () {
    const [response] = yield* zip([
      waitForResponse<B>(request.id, oppositeDirection(direction)),
      sendMessage(request, direction),
    ] as const)

    return response
  })

  return eff
}

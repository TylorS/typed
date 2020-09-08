import { doEffect, Effect } from '@typed/fp/Effect'
import { awaitRunning, FiberEnv, fork, join } from '@typed/fp/fibers'
import { orFail } from '@typed/fp/Future'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { JsonRpcFailure } from './JsonRpcFailure'
import { MessageDirection } from './MessageDirection'
import { oppositeDirection } from './oppositeDirection'
import { sendMessage } from './sendMessage'
import { waitForResponse } from './waitForResponse'

export const sendRequest = <
  A extends JsonRpc.Request<string, never>,
  B extends JsonRpc.Response<never, number, never>
>(
  request: A,
  direction: MessageDirection,
): Effect<ConnectionEnv & FiberEnv & JsonRpcFailure, B> => {
  const eff = doEffect(function* () {
    const responseFiber = yield* fork(waitForResponse<B>(request.id, oppositeDirection(direction)))

    yield* awaitRunning(responseFiber)

    yield* sendMessage(request, direction)

    return yield* orFail(JsonRpcFailure, join(responseFiber))
  })

  return eff
}

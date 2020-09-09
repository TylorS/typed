import { SchedulerEnv } from '@typed/fp/fibers'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
export declare const sendMessage: (
  message: JsonRpc.Message,
  direction: MessageDirection,
) => import('../Effect').Effect<ConnectionEnv & SchedulerEnv, void, unknown>
//# sourceMappingURL=sendMessage.d.ts.map

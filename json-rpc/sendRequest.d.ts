import { Effect } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
export declare const sendRequest: <
  A extends JsonRpc.Request<string, import('./json-rpc-v2').StructuredJson>,
  B extends JsonRpc.Response<
    import('./json-rpc-v2').StructuredJson,
    number,
    import('fp-ts/es6/Either').Json
  >
>(
  request: A,
  direction: MessageDirection,
) => Effect<ConnectionEnv & SchedulerEnv, B, unknown>
//# sourceMappingURL=sendRequest.d.ts.map

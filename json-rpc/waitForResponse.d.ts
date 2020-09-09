import { Effect } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
export declare const waitForResponse: <A extends JsonRpc.Response<
  import('./json-rpc-v2').StructuredJson,
  number,
  import('fp-ts/es6/Either').Json
>>(
  requestId: JsonRpc.Id,
  direction: MessageDirection,
) => Effect<ConnectionEnv & SchedulerEnv, A, unknown>
//# sourceMappingURL=waitForResponse.d.ts.map

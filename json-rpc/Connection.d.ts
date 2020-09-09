import { Disposable } from '@most/types'
import { Subject } from 'most-subject'

import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
export declare type ConnectionEnv = {
  readonly connection: Connection
}
export interface Connection extends Disposable {
  readonly id: JsonRpc.Id
  readonly [MessageDirection.Incoming]: Subject<JsonRpc.Message, JsonRpc.Message>
  readonly [MessageDirection.Outgoing]: Subject<JsonRpc.Message, JsonRpc.Message>
}
//# sourceMappingURL=Connection.d.ts.map

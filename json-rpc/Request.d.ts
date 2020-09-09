import { DropNever } from '@typed/fp/common'
import { TypedSchema } from '@typed/fp/io'

import { Id } from './Id'
import { JsonRpc } from './json-rpc-v2'
export declare const Request: <A extends
  | Readonly<
      Pick<JsonRpc.Request<string, import('./json-rpc-v2').StructuredJson>, 'method' | 'params'>
    >
  | Readonly<Pick<JsonRpc.Request<string, never>, 'method' | 'params'>>>(
  schema: TypedSchema<A>,
) => TypedSchema<
  Readonly<
    DropNever<A> & {
      jsonrpc: '2.0'
      id: JsonRpc.Id
    }
  >
>
export declare const isRequest: (
  i: unknown,
) => i is Readonly<
  DropNever<
    | {
        method: string
        params: import('./json-rpc-v2').StructuredJson
      }
    | {
        method: string
        params: never
      }
  > & {
    jsonrpc: '2.0'
    id: JsonRpc.Id
  }
>
//# sourceMappingURL=Request.d.ts.map

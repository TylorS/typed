import { TypedSchema, TypeOf } from '@typed/fp/io'

import { JsonRpc } from './json-rpc-v2'
export declare const Notification: <A extends TypedSchema<
  Readonly<
    Pick<JsonRpc.Notification<string, import('./json-rpc-v2').StructuredJson>, 'method' | 'params'>
  >
>>(
  schema: A,
) => TypedSchema<
  Readonly<
    TypeOf<A> & {
      jsonrpc: '2.0'
    }
  >
>
export declare const isNotification: (
  i: unknown,
) => i is
  | Readonly<
      {
        method: string
        params: import('./json-rpc-v2').StructuredJson
      } & {
        jsonrpc: '2.0'
      }
    >
  | Readonly<
      {
        method: string
        params: never
      } & {
        jsonrpc: '2.0'
      }
    >
//# sourceMappingURL=Notification.d.ts.map

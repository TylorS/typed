import { TypedSchema } from '@typed/fp/io'

import { Id } from './Id'
import { JsonRpc } from './json-rpc-v2'
export declare const Response: <
  A extends Readonly<
    Pick<JsonRpc.SuccessfulResponse<import('./json-rpc-v2').StructuredJson>, 'result'>
  >,
  B extends Readonly<Pick<JsonRpc.FailedResponse<number, import('fp-ts/es6/Either').Json>, 'error'>>
>(
  success: TypedSchema<A>,
  failure: TypedSchema<B>,
) => TypedSchema<
  | Readonly<
      A & {
        jsonrpc: '2.0'
        id: JsonRpc.Id
      }
    >
  | Readonly<
      B & {
        jsonrpc: '2.0'
        id: JsonRpc.Id
      }
    >
>
export declare const isResponse: (
  i: unknown,
) => i is JsonRpc.Response<
  import('./json-rpc-v2').StructuredJson,
  number,
  import('fp-ts/es6/Either').Json
>
export declare const SuccessfulResponse: <A extends Readonly<
  Pick<JsonRpc.SuccessfulResponse<import('./json-rpc-v2').StructuredJson>, 'result'>
>>(
  schema: TypedSchema<A>,
) => TypedSchema<
  Readonly<
    A & {
      jsonrpc: '2.0'
      id: JsonRpc.Id
    }
  >
>
export declare const isSuccessfulResponse: (
  i: unknown,
) => i is JsonRpc.SuccessfulResponse<import('./json-rpc-v2').StructuredJson>
export declare const FailedResponse: <A extends Readonly<
  Pick<JsonRpc.FailedResponse<number, import('fp-ts/es6/Either').Json>, 'error'>
>>(
  schema: TypedSchema<A>,
) => TypedSchema<
  Readonly<
    A & {
      jsonrpc: '2.0'
      id: JsonRpc.Id
    }
  >
>
export declare const isFailedResponse: (
  i: unknown,
) => i is JsonRpc.FailedResponse<number, import('fp-ts/es6/Either').Json>
//# sourceMappingURL=Response.d.ts.map

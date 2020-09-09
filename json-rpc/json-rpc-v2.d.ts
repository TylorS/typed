import { DropNever } from '@typed/fp/common'
import { Json, JsonArray, JsonRecord } from 'fp-ts/es6/Either'
export declare type StructuredJson = JsonRecord | JsonArray
export declare namespace JsonRpc {
  type Id = string | number
  type Message =
    | Request
    | DropNever<Request<string, never>>
    | Response
    | DropNever<Response<StructuredJson, number, never>>
    | Notification
    | DropNever<Notification<string, never>>
    | Batch
  type Batch = BatchRequest | BatchResponse
  type BatchRequest = ReadonlyArray<Request<any, any>>
  type BatchResponse = ReadonlyArray<Response<any, any>>
  interface Notification<
    Method extends string = string,
    Params extends StructuredJson = StructuredJson
  > {
    readonly jsonrpc: '2.0'
    readonly method: Method
    readonly params: Params
  }
  interface Request<
    Method extends string = string,
    Params extends StructuredJson = StructuredJson
  > {
    readonly jsonrpc: '2.0'
    readonly id: Id
    readonly method: Method
    readonly params: Params
  }
  type Response<
    Result extends StructuredJson = StructuredJson,
    Code extends number = number,
    ErrorData extends Json = Json
  > = SuccessfulResponse<Result> | FailedResponse<Code, ErrorData>
  interface SuccessfulResponse<Result extends StructuredJson = StructuredJson> {
    readonly jsonrpc: '2.0'
    readonly id: Id
    readonly result: Result
  }
  interface FailedResponse<Code extends number = number, ErrorData extends Json = Json> {
    readonly jsonrpc: '2.0'
    readonly id: Id
    readonly error: DropNever<Error<Code, ErrorData>>
  }
  interface Error<Code extends number = number, ErrorData extends Json = Json> {
    readonly code: Code
    readonly message: string
    readonly data: ErrorData
  }
  const enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
  }
}
//# sourceMappingURL=json-rpc-v2.d.ts.map

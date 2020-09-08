import { DropNever } from '@typed/fp/common'
import { Json, JsonArray, JsonRecord } from 'fp-ts/es6/Either'

export type StructuredJson = JsonRecord | JsonArray

export namespace JsonRpc {
  export type Id = string | number

  export type Message =
    | Request
    | DropNever<Request<string, never>>
    | Response
    | DropNever<Response<StructuredJson, number, never>>
    | Notification
    | DropNever<Notification<string, never>>
    | Batch

  export type Batch = BatchRequest | BatchResponse
  export type BatchRequest = ReadonlyArray<Request<any, any>>
  export type BatchResponse = ReadonlyArray<Response<any, any>>

  export interface Notification<
    Method extends string = string,
    Params extends StructuredJson = StructuredJson
  > {
    readonly jsonrpc: '2.0'
    readonly method: Method
    readonly params: Params
  }

  export interface Request<
    Method extends string = string,
    Params extends StructuredJson = StructuredJson
  > {
    readonly jsonrpc: '2.0'
    readonly id: Id
    readonly method: Method
    readonly params: Params
  }

  export type Response<
    Result extends StructuredJson = StructuredJson,
    Code extends number = number,
    ErrorData extends Json = Json
  > = SuccessfulResponse<Result> | FailedResponse<Code, ErrorData>

  export interface SuccessfulResponse<Result extends StructuredJson = StructuredJson> {
    readonly jsonrpc: '2.0'
    readonly id: Id
    readonly result: Result
  }

  export interface FailedResponse<Code extends number = number, ErrorData extends Json = Json> {
    readonly jsonrpc: '2.0'
    readonly id: Id
    readonly error: DropNever<Error<Code, ErrorData>>
  }

  export interface Error<Code extends number = number, ErrorData extends Json = Json> {
    readonly code: Code
    readonly message: string
    readonly data: ErrorData
  }

  export const enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    // -32000 to -32099 reserved for server errors
  }
}

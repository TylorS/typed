import { Disposable } from '@most/types'
import { Effect } from '@typed/fp/Effect'
import { HookOpEnvs } from '@typed/fp/hooks'
import { TypedSchema } from '@typed/fp/io'
import { Option } from 'fp-ts/es6/Option'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { JsonRpcFailure } from './JsonRpcFailure'

export interface Server {
  readonly registerNotification: RegisterNotification
  readonly registerRequest: RegisterRequest
  readonly handleMessage: HandleMessage
}

export interface RegisterNotification {
  <A extends JsonRpc.Notification<string, never>, E>(
    schema: TypedSchema<A>,
    notificationHandler: NotificationHandler<E, A>,
  ): Effect<E & HookOpEnvs, Disposable>
}

export type NotificationHandler<E, A> = (
  notification: A,
) => Effect<E & HookOpEnvs & ConnectionEnv, void>

export interface RegisterRequest {
  <A extends JsonRpc.Request<string, never>, E, B extends JsonRpc.Response<never, number, never>>(
    schema: TypedSchema<A>,
    requestHandler: RequestHandler<E, A, B>,
  ): Effect<E & HookOpEnvs, Disposable>
}

export type RequestHandler<E, A, B> = (request: A) => Effect<E & HookOpEnvs & ConnectionEnv, B>

export interface HandleMessage {
  (message: JsonRpc.Message): Effect<ConnectionEnv & JsonRpcFailure, Option<JsonRpc.Message>>
}

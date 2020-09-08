import { Disposable } from '@typed/fp/Disposable'
import { ask, doEffect, Effect, EnvOf, fail, use, zip } from '@typed/fp/Effect'
import {
  getKeyedRequirements,
  HookOpEnvs,
  runWithHooks,
  useCallback,
  useMemo,
} from '@typed/fp/hooks'
import { createDecoderFromSchema, createGuardFromSchema, TypedSchema } from '@typed/fp/io'
import * as E from 'fp-ts/es6/Either'
import { pipe } from 'fp-ts/es6/function'
import * as O from 'fp-ts/es6/Option'
import * as RA from 'fp-ts/es6/ReadonlyArray'
import { Decoder, draw } from 'io-ts/es6/Decoder'
import { Guard } from 'io-ts/es6/Guard'

import { JsonRpc } from './json-rpc-v2'
import { JsonRpcFailure } from './JsonRpcFailure'
import { isNotification } from './Notification'
import { isRequest } from './Request'
import { isResponse } from './Response'
import {
  HandleMessage,
  NotificationHandler,
  RegisterNotification,
  RegisterRequest,
  RequestHandler,
  Server,
} from './Server'

const EMPTY: [] = []

type ServerHandler<A, B> = {
  readonly handler: A
  readonly env: EnvOf<A>
  readonly guard: Guard<unknown, B>
  readonly decoder: Decoder<unknown, B>
}

export const useServer = doEffect(function* () {
  const notificationHandlers = yield* useMemo(
    () => new Map<TypedSchema<unknown>, ServerHandler<NotificationHandler<any, any>, any>>(),
    EMPTY,
  )

  const registerNotification: RegisterNotification = yield* useCallback(
    <A extends JsonRpc.Notification<string, never>, E>(
      schema: TypedSchema<A>,
      notificationHandler: NotificationHandler<E, A>,
    ): Effect<E & HookOpEnvs, Disposable> => {
      const eff = doEffect(function* () {
        const disposable = { dispose: () => notificationHandlers.delete(schema) }

        if (notificationHandlers.has(schema)) {
          return disposable
        }

        const env = yield* ask<E>()
        const guard = createGuardFromSchema(schema)
        const decoder = createDecoderFromSchema(schema)
        const requirements = yield* getKeyedRequirements(schema)

        notificationHandlers.set(schema, {
          handler: (notification) => runWithHooks(notificationHandler(notification), requirements),
          env,
          guard,
          decoder,
        })

        return disposable
      })

      return eff
    },
    EMPTY,
  )

  const requestHandlers = yield* useMemo(
    () => new Map<TypedSchema<unknown>, ServerHandler<RequestHandler<any, any, any>, any>>(),
    EMPTY,
  )

  const registerRequest: RegisterRequest = yield* useCallback(
    <A extends JsonRpc.Request<string, never>, E, B extends JsonRpc.Response<never, number, never>>(
      schema: TypedSchema<A>,
      requestHandler: RequestHandler<E, A, B>,
    ): Effect<E & HookOpEnvs, Disposable> => {
      const eff = doEffect(function* () {
        const disposable = { dispose: () => requestHandlers.delete(schema) }

        if (requestHandlers.has(schema)) {
          return disposable
        }

        const env = yield* ask<E>()
        const guard = createGuardFromSchema(schema)
        const decoder = createDecoderFromSchema(schema)
        const requirements = yield* getKeyedRequirements(schema)

        requestHandlers.set(schema, {
          handler: (request) => runWithHooks(requestHandler(request), requirements),
          env,
          guard,
          decoder,
        })

        return disposable
      })

      return eff
    },
    EMPTY,
  )

  const handleMessage: HandleMessage = yield* useCallback((message: JsonRpc.Message) => {
    const eff = doEffect(function* () {
      if (isRequest(message)) {
        const requestHandler = findHandler(message, requestHandlers)

        if (O.isSome(requestHandler)) {
          const { handler, env, decoder } = requestHandler.value
          const either = decoder.decode(message)

          if (E.isLeft(either)) {
            return yield* fail(JsonRpcFailure, new Error(draw(either.left)))
          }

          const response = yield* pipe(handler(message), use(env))

          return O.some(response as JsonRpc.Response)
        }

        const methodNotFound: JsonRpc.FailedResponse<JsonRpc.ErrorCode.MethodNotFound, never> = {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: JsonRpc.ErrorCode.MethodNotFound,
            message: `Method Not Found`,
          },
        }

        return O.some(methodNotFound)
      }

      if (isNotification(message)) {
        const notificationHandler = findHandler(message, notificationHandlers)

        if (O.isSome(notificationHandler)) {
          const { handler, env, decoder } = notificationHandler.value
          const either = decoder.decode(message)

          if (E.isLeft(either)) {
            return yield* fail(JsonRpcFailure, new Error(draw(either.left)))
          }

          yield* pipe(handler(message), use(env))

          return O.none
        }

        return O.none
      }

      if (Array.isArray(message) && message.every(isRequest)) {
        const responseOptions = yield* zip(message.map(handleMessage))
        const responses = pipe(responseOptions, RA.compact, RA.filter(isResponse))

        return responses.length > 0 ? O.some(responses) : O.none
      }

      return O.none
    })

    return eff
  }, EMPTY)

  const server: Server = yield* useMemo(
    () => ({ registerNotification, registerRequest, handleMessage }),
    EMPTY,
  )

  return server
})

function findHandler<A extends JsonRpc.Message>(
  message: A,
  handlerMap: Map<TypedSchema<unknown>, ServerHandler<any, any>>,
) {
  for (const handler of handlerMap.values()) {
    if (handler.guard.is(message)) {
      return O.some(handler)
    }
  }

  return O.none
}

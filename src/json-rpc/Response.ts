import { createGuardFromSchema, createSchema, TypedSchema } from '@typed/fp/io'
import { pipe } from 'fp-ts/es6/function'
import { Guard } from 'io-ts/es6/Guard'

import { Id } from './Id'
import { JsonRpc } from './json-rpc-v2'

export const Response = <
  A extends Readonly<Omit<JsonRpc.SuccessfulResponse, 'jsonrpc' | 'id'>>,
  B extends Readonly<Omit<JsonRpc.FailedResponse, 'jsonrpc' | 'id'>>
>(
  success: TypedSchema<A>,
  failure: TypedSchema<B>,
): TypedSchema<
  | Readonly<A & { jsonrpc: '2.0'; id: JsonRpc.Id }>
  | Readonly<B & { jsonrpc: '2.0'; id: JsonRpc.Id }>
> => createSchema((t) => t.union(SuccessfulResponse(success)(t), FailedResponse(failure)(t)))

const DefaultResponse = createSchema((t) =>
  t.union(DefaultSuccessfulResponse(t), DefaultFailedResponse(t)),
)

export const { is: isResponse }: Guard<unknown, JsonRpc.Response> = createGuardFromSchema(
  DefaultResponse,
)

export const SuccessfulResponse = <
  A extends Readonly<Omit<JsonRpc.SuccessfulResponse, 'jsonrpc' | 'id'>>
>(
  schema: TypedSchema<A>,
): TypedSchema<Readonly<A & { jsonrpc: '2.0'; id: JsonRpc.Id }>> =>
  createSchema((t) =>
    pipe(
      t.type({
        jsonrpc: t.literal('2.0'),
        id: Id(t),
      }),
      t.intersect(schema(t)),
    ),
  )

const DefaultSuccessfulResponse = SuccessfulResponse((t) =>
  t.union(t.type({ result: t.union(t.jsonRecord, t.jsonArray) }), t.type({ result: t.never })),
)

export const {
  is: isSuccessfulResponse,
}: Guard<unknown, JsonRpc.SuccessfulResponse> = createGuardFromSchema(DefaultSuccessfulResponse)

export const FailedResponse = <A extends Readonly<Omit<JsonRpc.FailedResponse, 'jsonrpc' | 'id'>>>(
  schema: TypedSchema<A>,
): TypedSchema<Readonly<A & { jsonrpc: '2.0'; id: JsonRpc.Id }>> =>
  createSchema((t) =>
    pipe(
      t.type({
        jsonrpc: t.literal('2.0'),
        id: Id(t),
      }),
      t.intersect(schema(t)),
    ),
  )

const DefaultFailedResponse = FailedResponse((t) =>
  t.union(
    t.type({
      error: t.type({
        code: t.number,
        message: t.string,
        data: t.json,
      }),
    }),
    t.type({
      error: t.type({
        code: t.number,
        message: t.string,
        data: t.never,
      }),
    }),
  ),
)

export const {
  is: isFailedResponse,
}: Guard<unknown, JsonRpc.FailedResponse> = createGuardFromSchema(DefaultFailedResponse)

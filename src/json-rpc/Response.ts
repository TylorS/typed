import { Json, JsonArray, JsonRecord } from 'fp-ts/es6/Either'
import { pipe } from 'fp-ts/es6/pipeable'

import { createSchema, TypedSchema } from '../io'
import { Id } from './Id'

export const SuccessResponse = <A extends JsonArray | JsonRecord>(
  schema: TypedSchema<A>,
): TypedSchema<{ readonly jsonrpc: '2.0'; readonly id: Id; readonly result: Readonly<A> }> =>
  createSchema((t) =>
    t.type({
      jsonrpc: t.literal('2.0'),
      id: Id(t),
      result: schema(t),
    }),
  )

// Code: -32000 to -32099 reserved for server errors
export const FailedResponse = <
  A extends { readonly code: number; readonly message: string; readonly data?: Json }
>(
  schema: TypedSchema<A>,
): TypedSchema<{ readonly jsonrpc: '2.0'; readonly id: Id; readonly error: A }> =>
  createSchema((t) =>
    t.type({
      jsonrpc: t.literal('2.0'),
      id: Id(t),
      error: pipe(t.partial({ data: t.unknown }), t.intersect(schema(t))),
    }),
  )

export const ParseError = FailedResponse((t) =>
  t.type({ code: t.literal(-32700), message: t.string }),
)

export const InvalidRequest = FailedResponse((t) =>
  t.type({
    code: t.literal(-32600),
    message: t.string,
  }),
)

export const MethodNotFound = FailedResponse((t) =>
  t.type({
    code: t.literal(-32601),
    message: t.string,
  }),
)

export const InvalidParams = FailedResponse((t) =>
  t.type({
    code: t.literal(-32602),
    message: t.string,
  }),
)

export const InternalError = FailedResponse((t) =>
  t.type({
    code: t.literal(-32603),
    message: t.string,
  }),
)

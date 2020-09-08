import { DropNever } from '@typed/fp/common'
import { createGuardFromSchema, createSchema, TypedSchema } from '@typed/fp/io'
import { pipe, unsafeCoerce } from 'fp-ts/es6/function'

import { Id } from './Id'
import { JsonRpc } from './json-rpc-v2'

export const Request = <
  A extends Readonly<
    Omit<JsonRpc.Request, 'jsonrpc' | 'id'> | Omit<JsonRpc.Request<string, never>, 'jsonrpc' | 'id'>
  >
>(
  schema: TypedSchema<A>,
): TypedSchema<Readonly<DropNever<A> & { jsonrpc: '2.0'; id: JsonRpc.Id }>> =>
  unsafeCoerce(
    createSchema((t) =>
      pipe(
        t.type({
          jsonrpc: t.literal('2.0'),
          id: Id(t),
        }),
        t.intersect(schema(t)),
      ),
    ),
  )

const DefaultRequest = Request((t) =>
  t.union(
    t.type({
      method: t.string,
      params: t.union(t.jsonRecord, t.jsonArray),
    }),
    t.type({
      method: t.string,
      params: t.never,
    }),
  ),
)

export const { is: isRequest } = createGuardFromSchema(DefaultRequest)

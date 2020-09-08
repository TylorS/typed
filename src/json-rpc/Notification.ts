import { DropNever } from '@typed/fp/common'
import { createGuardFromSchema, createSchema, TypedSchema } from '@typed/fp/io'
import { pipe, unsafeCoerce } from 'fp-ts/es6/function'

import { JsonRpc } from './json-rpc-v2'

export const Notification = <
  A extends Readonly<
    Omit<JsonRpc.Notification, 'jsonrpc'> | Omit<JsonRpc.Notification<string, never>, 'jsonrpc'>
  >
>(
  schema: TypedSchema<A>,
): TypedSchema<Readonly<DropNever<A> & { jsonrpc: '2.0' }>> =>
  unsafeCoerce(
    createSchema((t) =>
      pipe(
        t.type({
          jsonrpc: t.literal('2.0'),
        }),
        t.intersect(schema(t)),
      ),
    ),
  )

const DefaultNotification = Notification((t) =>
  t.union(
    t.type({ method: t.string, params: t.union(t.jsonRecord, t.jsonArray) }),
    t.type({ method: t.string, params: t.never }),
  ),
)

export const { is: isNotification } = createGuardFromSchema(DefaultNotification)

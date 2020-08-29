import { Json } from 'fp-ts/es6/Either'
import { pipe } from 'fp-ts/es6/function'

import { makeTyped, TypedSchema } from '../io'
import { Id } from './Id'

export function Request<A extends { readonly method: string; readonly params?: Json }>(
  schema: TypedSchema<A>,
): TypedSchema<{ readonly jsonrpc: '2.0'; readonly id: Id } & A> {
  return makeTyped((t) =>
    pipe(
      schema(t),
      t.intersect(
        t.type({
          jsonrpc: t.literal('2.0'),
          id: Id(t),
        }),
      ),
    ),
  )
}

import { JsonArray, JsonRecord } from 'fp-ts/es6/Either'
import { pipe } from 'fp-ts/es6/function'
import * as S from 'io-ts/es6/Schema'

export function Notification<
  A extends { readonly method: string; readonly params?: JsonRecord | JsonArray }
>(
  schema: S.Schema<A>,
): S.Schema<
  { readonly jsonrpc: '2.0' } & {
    readonly [K in keyof A]: A[K]
  }
> {
  return S.make((S) =>
    pipe(
      schema(S),
      S.intersect(
        S.type({
          jsonrpc: S.literal('2.0'),
        }),
      ),
    ),
  )
}

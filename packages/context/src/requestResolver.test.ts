import * as Effect from '@effect/io/Effect'
import * as Request from '@effect/io/Request'
import { describe, expect, it } from 'vitest'

import * as Context from './index.js'

describe(Context.RequestResolver.name, () => {
  it('allows calling a function from Effect context', async () => {
    interface FooRequest extends Request.Request<never, string> {
      readonly _tag: 'Foo'
      readonly input: string
    }
    const FooRequest = Context.Request.tagged<FooRequest>('Foo')('FooRequest')

    interface BarRequest extends Request.Request<never, number> {
      readonly _tag: 'Bar'
    }
    const BarRequest = Context.Request.tagged<BarRequest>('Bar')('BarRequest')

    const FooBar = Context.RequestResolver({
      foo: FooRequest,
      bar: BarRequest,
    })((_) => class FooBar extends _('FooBar') {}) // "short-hand" for creating opaque identifiers

    const test = Effect.gen(function* ($) {
      const foo = yield* $(FooRequest.make({ input: 'foo' }))
      const bar = yield* $(FooBar.requests.bar())

      return foo.length + bar
    }).pipe(
      Effect.provideSomeLayer(
        FooBar.fromFunction((req) => (req._tag === 'Foo' ? req.input + req.input : 1)),
      ),
    )

    const result = await Effect.runPromise(test)

    expect(result).toBe(7)
  })
})

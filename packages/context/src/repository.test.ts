import * as Effect from '@effect/io/Effect'
import { describe, expect, it } from 'vitest'

import { Fn } from './fn.js'
import { id } from './identifier.js'
import { repository } from './repository.js'

class FooService extends id('FooService') {}
const Foo = Fn<(foo: string) => Effect.Effect<never, never, string>>()(FooService)

class BarService extends id('BarService') {}
const Bar = Fn<(bar: string) => Effect.Effect<never, never, string>>()(BarService)

const FooBar = repository({ foo: Foo, bar: Bar })

describe(repository.name, () => {
  it('allows combining multiple functions into a single layer', async () => {
    const test: Effect.Effect<FooService | BarService, never, string> = Effect.gen(function* (_) {
      const foo = yield* _(FooBar.foo('foo'))
      const bar = yield* _(FooBar.bar('bar'))

      return foo + bar
    })

    expect(
      await Effect.runPromise(
        test.pipe(
          Effect.provideLayer(
            FooBar.implement({
              foo: (x) => Effect.sync(() => 'foo' + x),
              bar: (x) => Effect.sync(() => 'bar' + x),
            }),
          ),
        ),
      ),
    ).toBe('foofoobarbar')
  })

  it('allows retrieving the full service', async () => {
    const test: Effect.Effect<FooService | BarService, never, string> = Effect.gen(function* (_) {
      const service = yield* _(FooBar)

      const foo = yield* _(service.foo('foo'))
      const bar = yield* _(service.bar('bar'))

      return foo + bar
    })

    expect(
      await Effect.runPromise(
        test.pipe(
          Effect.provideLayer(
            FooBar.implement({
              foo: (x) => Effect.sync(() => 'foo' + x),
              bar: (x) => Effect.sync(() => 'bar' + x),
            }),
          ),
        ),
      ),
    ).toBe('foofoobarbar')
  })
})

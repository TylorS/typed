import * as Context from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'
import { describe, expect, it } from 'vitest'

import { struct, tuple } from './many.js'

interface Foo {
  foo: string
}
const Foo = Context.Tag<Foo>()
interface Bar {
  bar: string
}
const Bar = Context.Tag<Bar>()

describe(tuple.name, () => {
  it('combines multiple tags into a single Effect', async () => {
    const FooBar = tuple(Foo, Bar)

    const test = FooBar.pipe(
      Effect.map(([foo, bar]) => foo.foo + bar.bar),
      FooBar.provide([{ foo: 'foo' }, { bar: 'bar' }]),
    )

    expect(await Effect.runPromise(test)).toBe('foobar')
  })
})

describe(struct.name, () => {
  it('combines multiple tags into a single Effect', async () => {
    const FooBar = struct({ foo: Foo, bar: Bar })

    const test = FooBar.with(({ foo, bar }) => foo.foo + bar.bar).pipe(
      FooBar.provide({ foo: { foo: 'foo' }, bar: { bar: 'bar' } }),
    )

    expect(await Effect.runPromise(test)).toBe('foobar')
  })
})

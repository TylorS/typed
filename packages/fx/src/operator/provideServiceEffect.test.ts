import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { Tag } from '@effect/data/Context'
import { describe, it } from 'vitest'

import { serviceWith } from '../constructor/serviceWith.js'
import { collectAll } from '../run/collectAll.js'

import { provideServiceEffect } from './provideServiceEffect.js'

describe(import.meta.url, () => {
  describe(provideServiceEffect.name, () => {
    it('allows merging multiple streams together', async () => {
      interface Foo {
        readonly foo: number
      }
      const Foo = Object.assign(Tag<Foo>(), {
        with<A>(f: (foo: Foo) => A) {
          return serviceWith(Foo)(f)
        },
        provide(foo: number) {
          return provideServiceEffect(
            Foo,
            Effect.sync(() => ({ foo })),
          )
        },
      })

      const test = pipe(
        Foo.with((f) => f.foo),
        Foo.provide(42),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [42])
    })
  })
})

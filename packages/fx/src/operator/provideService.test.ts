import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { Tag } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { serviceWith } from '../constructor/serviceWith.js'
import { collectAll } from '../run/collectAll.js'

import { provideService } from './provideService.js'

describe(import.meta.url, () => {
  describe(provideService.name, () => {
    it('allows merging multiple streams together', async () => {
      interface Foo {
        readonly foo: number
      }
      const Foo = Object.assign(Tag<Foo>(), {
        with<A>(f: (foo: Foo) => A) {
          return serviceWith(Foo)(f)
        },
        provide(foo: number) {
          return provideService(Foo, { foo })
        },
      })

      const test = pipe(
        Foo.with((f) => f.foo),
        Foo.provide(42),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [42])
    })
  })
})
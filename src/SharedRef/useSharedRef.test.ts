import { doEffect, execEffect } from '@typed/fp/Effect/exports'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/es6/function'
import { newIORef } from 'fp-ts/es6/IORef'

import { provideSharedRef } from './provideSharedRef'
import { createSharedRef, SharedRef, SharedRefEnv } from './SharedRef'
import { wrapSharedRef } from './wrapSharedRef'

export const test = describe(`useRef`, [
  it(`allows reading/writing a ref`, ({ equal }, done) => {
    const FOO = Symbol('Foo')
    interface Foo extends SharedRef<typeof FOO, number> {}
    interface FooEnv extends SharedRefEnv<Foo> {}
    const Foo = createSharedRef<Foo>(FOO)
    const [readFoo, writeFoo, modifyFoo] = wrapSharedRef<Foo, FooEnv>(Foo)
    const initial = 1

    const eff = doEffect(function* () {
      try {
        equal(initial, yield* readFoo)
        equal(initial + 1, yield* writeFoo(initial + 1))
        equal(initial + 2, yield* modifyFoo((x) => x + 1))
        done()
      } catch (error) {
        done(error)
      }
    })

    pipe(eff, provideSharedRef(Foo, newIORef(initial)), execEffect({}))
  }),
])

import { doEffect, execEffect } from '@typed/fp/Effect'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/es6/function'
import { newIORef } from 'fp-ts/es6/IORef'

import { provideRef } from './provideRef'
import { createRef, Ref, RefEnv } from './Ref'
import { useRef } from './useRef'

export const test = describe(`useRef`, [
  it(`allows reading/writing a ref`, ({ equal }) => {
    const FOO = Symbol('Foo')
    interface Foo extends Ref<typeof FOO, number> {}
    interface FooEnv extends RefEnv<Foo> {}
    const Foo = createRef<Foo>(FOO)
    const [readFoo, writeFoo, modifyFoo] = useRef<Foo, FooEnv>(Foo)
    const initial = 1

    const eff = doEffect(function* () {
      equal(initial, yield* readFoo)
      equal(initial + 1, yield* writeFoo(initial + 1))
      equal(initial + 2, yield* modifyFoo((x) => x + 1))
    })

    pipe(eff, provideRef(Foo, newIORef(initial)), execEffect({}))
  }),
])

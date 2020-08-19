import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/lib/pipeable'

import { ask, doEffect, Effect, execEffect } from '.'
import { Op, createOp, provideOp, useOp } from './Op'

export const test = describe(`Op`, [
  it(`allows delaying environment requirements`, ({ equal }) => {
    const ADD = Symbol()
    interface Add extends Op<typeof ADD, [x: number, y: number], number> {}
    const Add = createOp<Add>(ADD)
    const add = useOp(Add)

    const LOG = Symbol()
    interface Log extends Op<typeof LOG, [message: string, ...messages: string[]], void> {}
    const Log = createOp<Log>(LOG)
    const log = useOp(Log)

    const FOO = Symbol()
    interface Foo extends Op<typeof FOO, [], string> {}
    const Foo = createOp<Foo>(FOO)
    const foo = useOp(Foo)

    const program = doEffect(function* () {
      const x = yield* add(1, 2)

      yield* log(yield* foo())

      equal(3, x)

      yield* log(x.toString())
    })

    const logImplementation = (...messages: readonly string[]) =>
      doEffect(function* () {
        const { log } = yield* ask<{ log: (message: string) => void }>()

        log(messages.join(' '))
      })

    pipe(
      program,
      // Comment out any of these providers an you'll be greeted with an error
      provideOp(Add, (x, y) => Effect.of(x + y)),
      provideOp(Log, logImplementation),
      provideOp(Foo, () => Effect.of('hi')),
      execEffect({ log: console.log }),
    )
  }),
])

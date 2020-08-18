import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/lib/pipeable'

import { ask, doEffect, Effect, execPure, provide } from '.'
import { Computation, createComputation, provideComputation, useComputation } from './Op'

export const test = describe(`Op`, [
  it(`allows delaying environment requirements`, ({ equal }) => {
    const ADD = Symbol()
    interface Add extends Computation<typeof ADD, [number, number], number> {}
    const Add = createComputation<Add>()(ADD)
    const add = useComputation(Add)

    const LOG = Symbol()
    interface Log extends Computation<typeof LOG, readonly string[], void> {}
    const Log = createComputation<Log>()(LOG)
    const log = useComputation(Log)

    const program = doEffect(function* () {
      const x = yield* add(1, 2)

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
      provideComputation(Add, (x, y) => Effect.of(x + y)),
      provideComputation(Log, logImplementation),
      provide({ log: console.log }),
      execPure,
    )
  }),
])

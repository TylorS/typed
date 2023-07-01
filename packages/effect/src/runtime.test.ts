import { describe, expect, it } from 'vitest'

import { Effect } from './Effect.js'
import * as Exit from './Exit.js'
import { Lambda } from './Lambda.js'
import { Op } from './Op.js'
import { pipe } from './_function.js'
import * as core from './core.js'
import { ForEach, forEach } from './ops.js'
import { Executor } from './runtime.js'

describe(Executor, () => {
  it.concurrent('executes Succeed effect', async () => {
    const value = await runPromise(core.succeed(1))

    expect(value).toBe(1)
  })

  it.concurrent('executes Map effect', async () => {
    const value = await runPromise(core.map(core.succeed(1), (n) => n + 1))

    expect(value).toBe(2)
  })

  it.concurrent('executes FlatMap effect', async () => {
    const value = await runPromise(core.flatMap(core.succeed(1), (n) => core.succeed(n + 1)))

    expect(value).toBe(2)
  })

  it.concurrent('executes simple Op effect', async () => {
    interface AddLambda extends Lambda {
      readonly InConstraint: readonly [number, number]
      readonly Out: number
    }
    class Add extends Op<Add, AddLambda>('test/Add') {}

    const add = pipe(
      core.op(Add, [1, 2]),
      core.handle(Op.handle(Add)(([a, b], resume) => resume(a + b))),
    )

    const value = await runPromise(add)

    expect(value).toBe(3)
  })

  it.concurrent('executes return Op effect', async () => {
    const actual = await runPromise(
      pipe(
        forEach([1, 2, 3]),
        core.map((x) => x + 1),
        ForEach.handle,
        core.map((xs) => xs.map((x) => x + 1)),
      ),
    )

    expect(actual).toEqual([3, 4, 5])
  })
})

function runPromiseExit<A>(effect: Effect<never, A>): Promise<Exit.Exit<never, A>> {
  return new Promise((resolve) => {
    const executor = new Executor(effect)

    executor.addObserver(resolve)
    executor.start()
  })
}

function runPromise<A>(effect: Effect<never, A>): Promise<A> {
  return runPromiseExit(effect).then(
    Exit.match(
      (cause) => Promise.reject(cause),
      (value) => Promise.resolve(value),
    ),
  )
}

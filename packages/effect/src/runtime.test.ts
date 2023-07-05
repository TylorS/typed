import { describe, expect, it } from 'vitest'

import { Effect } from './Effect.js'
import * as Exit from './Exit.js'
import { Lambda } from './Lambda.js'
import { Op } from './Op.js'
import * as core from './core.js'
import { forEach, withForEach } from './ops.js'
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
    class Add extends Op<Add, never, AddLambda>('test/Add') {
      static add = (a: number, b: number): Effect<Add, never, number> => core.op(Add, [a, b])
    }

    const add = core.handle(
      Add.add(1, 2),
      Add.handle(([a, b]) => core.succeed(a + b)),
    )

    const value = await runPromise(add)

    expect(value).toBe(3)
  })

  it.concurrent('executes return Op effect', async () => {
    const actual = await runPromise(
      core.map(withForEach(core.map(forEach([1, 2, 3]), (x) => x + 1)), (xs) => {
        return xs.map((x) => x + 1)
      }),
    )

    expect(actual).toEqual([3, 4, 5])
  })

  it.concurrent('executes return Op effect more than once', async () => {
    const actual = await runPromise(
      core.map(
        withForEach(
          core.map(
            core.flatMap(
              forEach([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
              ]),
              forEach,
            ),
            (x) => x + 1,
          ),
        ),
        (xs) => {
          return xs.map((x) => x + 1)
        },
      ),
    )

    expect(actual).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it.concurrent('executes return Op effect multiple times once', async () => {
    const actual = await runPromise(
      core.map(
        withForEach(
          core.map(
            core.flatMap(
              core.flatMap(
                forEach([
                  [[1], [2], [3]],
                  [[4], [5], [6]],
                  [[7], [8], [9]],
                ]),
                forEach,
              ),
              forEach,
            ),
            (x) => x + 1,
          ),
        ),
        (xs) => {
          return xs.map((x) => x + 1)
        },
      ),
    )

    expect(actual).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it.concurrent('runs recursive fib', async () => {
    const promiseBased = async (n: number): Promise<number> => {
      if (n < 2) {
        return 1
      } else {
        return (await promiseBased(n - 1)) + (await promiseBased(n - 2))
      }
    }

    const fib = (n: number): Effect<never, never, number> =>
      n < 2 ? core.succeed(1) : core.flatMap(fib(n - 1), (a) => core.map(fib(n - 2), (b) => a + b))

    const ITERATIONS = 10_000

    console.time('promise')
    for (let i = 0; i < ITERATIONS; i++) {
      await promiseBased(10)
    }
    console.timeEnd('promise')

    console.time('effect')
    await runPromise(repeatN(fib(10), ITERATIONS))
    console.timeEnd('effect')
  })
})

function repeatN<R, E, A>(effect: Effect<R, E, A>, n: number): Effect<R, E, A> {
  let output = effect

  for (let i = 0; i < n; ++i) {
    output = core.flatMap(output, () => effect)
  }

  return output
}

function runPromiseExit<E, A>(effect: Effect<never, E, A>): Promise<Exit.Exit<E, A>> {
  return new Promise((resolve) => {
    const executor = new Executor(effect)

    executor.addObserver(resolve)
    executor.start()
  })
}

function runPromise<E, A>(effect: Effect<never, E, A>): Promise<A> {
  return runPromiseExit(effect).then(
    Exit.match(
      (cause) => Promise.reject(cause),
      (value) => Promise.resolve(value),
    ),
  )
}

import { performance } from 'node:perf_hooks'

import * as Eff from '@effect/core/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { effectTest, effectCoreTest } from '../helpers.js'

import {
  TestSuite,
  RunTestConfig,
  runTestSuite,
  printTestSuiteResult,
} from '@/benchmark/src/benchmark.js'
import * as Effect from '@/io/src/Effect.js'

const config: RunTestConfig = RunTestConfig(100, () => performance.now())
const amount = 25

const suite: TestSuite = TestSuite(`fib(${amount})`, [
  effectTest(() => {
    const fib = (n: number): Effect.Effect<never, never, number> =>
      n < 2
        ? Effect.of(n)
        : pipe(
            fib(n - 1),
            Effect.flatMap((a) =>
              pipe(
                fib(n - 2),
                Effect.map((b) => a + b),
              ),
            ),
          )

    return fib(amount)
  }),
  effectCoreTest(() => {
    const fib = (n: number): Eff.Effect<never, never, number> =>
      n < 2
        ? Eff.succeed(n)
        : pipe(
            fib(n - 1),
            Eff.flatMap((a) =>
              pipe(
                fib(n - 2),
                Eff.map((b) => a + b),
              ),
            ),
          )

    return fib(amount)
  }),
])

runTestSuite(suite, config).then(printTestSuiteResult, (error) => {
  console.error(error)
  process.exitCode = 1
})

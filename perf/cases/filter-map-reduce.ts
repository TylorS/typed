import { performance } from 'node:perf_hooks'

import { pipe } from '@fp-ts/data/Function'
import * as MC from '@most/core'
import * as Fx from '@typed/fx'
import * as rxjs from 'rxjs'

import { fxTest, mostTest, rxjsTest, streamEffectTest } from '../helpers.js'

import {
  TestSuite,
  RunTestConfig,
  runTestSuite,
  printTestSuiteResult,
} from '@/benchmark/src/benchmark.js'
import * as Stream from '@/io/src/Stream.js'

const config: RunTestConfig = RunTestConfig(100, () => performance.now())
const array = Array.from({ length: 100_000 }, (_, i) => i)
const filterEven = (n: number) => n % 2 === 0
const double = (n: number) => n * 2
const sum = (a: number, b: number) => a + b

const suite: TestSuite = TestSuite(`filter -> map -> reduce ${array.length} integers`, [
  streamEffectTest(() =>
    pipe(
      Stream.fromArray(array),
      Stream.filter(filterEven),
      Stream.map(double),
      Stream.runReduce(0, sum),
    ),
  ),
  fxTest(() =>
    pipe(Fx.fromIterable(array), Fx.filter(filterEven), Fx.map(double), Fx.scan(0, sum)),
  ),
  mostTest((fromArray) =>
    pipe(fromArray(array), MC.filter(filterEven), MC.map(double), MC.scan(sum, 0)),
  ),
  rxjsTest(() =>
    pipe(rxjs.from(array), rxjs.filter(filterEven), rxjs.map(double), rxjs.scan(sum, 0)),
  ),
])

runTestSuite(suite, config).then(printTestSuiteResult, (error) => {
  console.error(error)
  process.exitCode = 1
})

import { benchmark, type BenchmarkOptions } from "@/test/benchmark"
import * as mostCore from "@most/core"
import { newDefaultScheduler } from "@most/scheduler"
import type * as mostTypes from "@most/types"
import * as Effect from "effect/Effect"
import type * as rxjs from "rxjs"

const mostScheduler = newDefaultScheduler()

export function comparison(name: string, tests: {
  rxjs?: () => rxjs.Observable<any>
  most?: () => mostTypes.Stream<any>
  fx?: () => Effect.Effect<never, any, any>
  array?: () => any
}, options?: BenchmarkOptions) {
  let bench = benchmark(name)

  if (tests.rxjs) {
    bench = bench.test(
      "rxjs",
      runRxjs(tests.rxjs())
    )
  }

  if (tests.most) {
    bench = bench.test(
      "most",
      runMost(tests.most())
    )
  }

  if (tests.fx) {
    bench = bench.test(
      "fx",
      tests.fx()
    )
  }

  if (tests.array) {
    bench = bench.test(
      "array",
      Effect.sync(() => tests.array!())
    )
  }

  return bench.run(options)
}

const runRxjs = (observable: rxjs.Observable<any>) =>
  Effect.async<never, never, void>((resume) => {
    observable.subscribe({ complete: () => resume(Effect.unit) })
  })

const runMost = (stream: mostTypes.Stream<any>) => Effect.promise(() => mostCore.runEffects(stream, mostScheduler))

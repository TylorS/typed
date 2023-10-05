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
  const comparisions: any = []

  if (tests.rxjs) {
    comparisions.push({ name: "rxjs", effect: runRxjs(tests.rxjs()) })
  }

  if (tests.most) {
    comparisions.push({ name: "most", effect: runMost(tests.most()) })
  }

  if (tests.fx) {
    comparisions.push({ name: "fx", effect: tests.fx() })
  }

  if (tests.array) {
    comparisions.push({ name: "array", effect: Effect.sync(() => tests.array!()) })
  }

  return benchmark(name).comparison<any, any>("", comparisions).run(options)
}

const runRxjs = (observable: rxjs.Observable<any>) =>
  Effect.async<never, never, void>((resume) => {
    observable.subscribe({ complete: () => resume(Effect.unit) })
  })

const runMost = (stream: mostTypes.Stream<any>) => Effect.promise(() => mostCore.runEffects(stream, mostScheduler))

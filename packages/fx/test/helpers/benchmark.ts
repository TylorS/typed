import * as Effect from "@effect/io/Effect"
import { performance } from "perf_hooks"
import { describe, it } from "vitest"

const SECOND_MS = 1000
const MINUTE_MS = SECOND_MS * 60

export function benchmark(name: string): BenchmarkBuilder {
  return new BenchmarkBuilder(name, [])
}

export class BenchmarkBuilder {
  constructor(readonly name: string, readonly benchmarks: Array<Benchmark<any, any>>) {}

  test<E, A>(
    name: string,
    effect: Effect.Effect<never, E, A>,
    options?: BenchmarkOptions
  ): BenchmarkBuilder {
    return new BenchmarkBuilder(this.name, [
      ...this.benchmarks,
      Benchmark(name, effect, options)
    ])
  }

  run(options?: BenchmarkOptions) {
    benchmarkSuite(this.name, this.benchmarks, options)
  }
}

interface Benchmark<E, A> {
  readonly name: string
  readonly effect: Effect.Effect<never, E, A>
  readonly timeout?: number
  readonly iterations?: number
}

export interface BenchmarkOptions {
  readonly timeout?: number // 30s
  readonly iterations?: number // 1000
}

function Benchmark<E, A>(
  name: string,
  effect: Effect.Effect<never, E, A>,
  options?: BenchmarkOptions
): Benchmark<E, A> {
  return {
    name,
    effect,
    ...options
  }
}

function benchmarkSuite<const B extends ReadonlyArray<Benchmark<any, any>>>(
  name: string,
  benchmarks: B,
  options?: BenchmarkOptions
) {
  describe(name, () => {
    const reports = benchmarks.map((benchmark) =>
      benchmarkIt({
        ...options,
        ...benchmark
      })
    )

    afterAll(() =>
      console.table(
        reports.reduce((acc, report) => {
          Object.assign(
            acc,
            createTabularData(report.name, report.iterations, report.getTotal(), report.getRuns())
          )

          return acc
        }, {}),
        tabularDataKeys
      )
    )
  })
}

function benchmarkIt<E, A>(
  { effect, name, ...options }: Benchmark<E, A>
) {
  let total = 0
  const runs: Array<number> = []
  const iterations = options?.iterations || 1000

  it(`[Benchmark] ${name}`, () =>
    Effect.runPromise(Effect.repeatN(
      timed(effect, (time) => {
        total += time
        runs.push(time)
      }),
      iterations
    )))

  return {
    name,
    iterations,
    getTotal: () => total,
    getRuns: () => runs
  } as const
}

const tabularDataKeys = [
  "low",
  "high",
  "median",
  "average",
  "total",
  "iterations"
]

function createTabularData(name: string, iterations: number, total: number, runs: Array<number>) {
  runs.sort((a, b) => a - b)

  const low = runs[0]
  const high = runs[runs.length - 1]
  const median = runs[Math.floor(runs.length / 2)]
  const average = total / iterations

  return {
    [name]: {
      iterations: iterations.toLocaleString(),
      total: formatMilliseconds(total),
      low: formatMilliseconds(low),
      high: formatMilliseconds(high),
      median: formatMilliseconds(median),
      average: formatMilliseconds(average)
    }
  }
}

function formatMilliseconds(ms: number): string {
  if (ms > MINUTE_MS) {
    return `${(ms / MINUTE_MS).toFixed(4)}min`
  } else if (ms > SECOND_MS) {
    return `${(ms / SECOND_MS).toFixed(4)}s`
  } else {
    return `${ms.toFixed(4)}ms`
  }
}

const timed = <R, E, A, B>(effect: Effect.Effect<R, E, A>, f: (time: number, a: A) => B) =>
  Effect.suspend(() => {
    const start = performance.now()

    return Effect.map(effect, (a) => f(performance.now() - start, a))
  })

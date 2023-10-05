import * as Effect from "effect/Effect"
import { performance } from "perf_hooks"
import { afterAll, describe, it } from "vitest"

const SECOND_MS = 1000
const MINUTE_MS = SECOND_MS * 60

export function benchmark(name: string): BenchmarkBuilder {
  return new BenchmarkBuilder(name, [])
}

export class BenchmarkBuilder {
  constructor(readonly name: string, readonly benchmarks: Array<Benchmark<any, any> | Comparison<any, any>>) {}

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

  comparison<E, A>(
    name: string,
    tests: Array<{
      name: string
      effect: Effect.Effect<never, E, A>
      options?: BenchmarkOptions
    }>,
    options?: BenchmarkOptions
  ): BenchmarkBuilder {
    return new BenchmarkBuilder(this.name, [
      ...this.benchmarks,
      Comparison(name, tests, options)
    ])
  }

  run(options?: BenchmarkOptions) {
    benchmarkSuite(`[Benchmark] ${this.name}`, this.benchmarks, options)
  }
}

type AnyBenchmarks = ReadonlyArray<Benchmark<any, any> | Comparison<any, any>>

interface Comparison<E, A> {
  readonly name: string
  readonly tests: Array<{
    name: string
    effect: Effect.Effect<never, E, A>
    options?: BenchmarkOptions
  }>
  readonly timeout?: number
  readonly iterations?: number
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

function Comparison<E, A>(
  name: string,
  tests: Array<{
    name: string
    effect: Effect.Effect<never, E, A>
    options?: BenchmarkOptions
  }>,
  options?: BenchmarkOptions
): Comparison<E, A> {
  return {
    name,
    tests,
    ...options
  }
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

function benchmarkSuite<const B extends AnyBenchmarks>(
  name: string,
  benchmarks: B,
  options?: BenchmarkOptions
) {
  describe(name, () => {
    const reports = benchmarks.map((benchmark) => {
      if ("effect" in benchmark) {
        return benchmarkIt({
          ...options,
          ...benchmark
        })
      } else {
        return benchmarkComparison({
          ...options,
          ...benchmark
        })
      }
    })

    afterAll(() => {
      const testReports = reports.flatMap((report) =>
        report._tag === "Test" ? [report] : report.reports().map((r) => ({ ...r, name: `${report.name} :: ${r.name}` }))
      )
      const comparisonReports = reports.filter((report): report is ComparisonReport => report._tag === "Comparison")

      console.log("")
      console.log(name)

      console.table(
        testReports.reduce((acc, report) => {
          Object.assign(
            acc,
            createTabularData(report.name, report.iterations, report.getTotal(), report.getRuns())
          )

          return acc
        }, {}),
        tabularDataKeys
      )

      for (const report of comparisonReports) {
        console.log("")
        console.log(`[Comparision] ${report.name}`)
        console.table(createComparisonTabularData(report.reports()), tabularDataKeys.filter((x) => x !== "iterations"))
      }
    })
  })
}

type ComparisonReport = {
  readonly _tag: "Comparison"
  readonly name: string
  readonly reports: () => Array<TestReport>
}

type TestReport = {
  readonly _tag: "Test"
  readonly name: string
  readonly iterations: number
  readonly getTotal: () => number
  readonly getRuns: () => Array<number>
}

function benchmarkIt<E, A>(
  { effect, name, ...options }: Benchmark<E, A>
): TestReport {
  let total = 0
  const runs: Array<number> = []
  const iterations = options?.iterations || 1000

  it(`[Benchmark] ${name}`, () =>
    Effect.runPromise(Effect.repeatN(
      timed(effect, (time) => {
        total += time
        runs.push(time)
      }),
      iterations - 1
    )))

  return {
    _tag: "Test",
    name,
    iterations,
    getTotal: () => total,
    getRuns: () => runs
  } as const
}

function benchmarkComparison<E, A>(
  { name, tests, ...options }: Comparison<E, A>
): ComparisonReport {
  const reports: Array<TestReport> = []

  describe(`[Comparison] ${name}`, () => {
    for (const benchmark of tests) {
      reports.push(benchmarkIt(Benchmark(benchmark.name, benchmark.effect, { ...options, ...benchmark.options })))
    }
  })

  return {
    _tag: "Comparison",
    name,
    reports: () => reports
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

function createComparisonTabularData(reports: Array<TestReport>) {
  const reportData = reports.map(
    (r): { name: string; total: number; low: number; high: number; median: number; average: number } => {
      const tabular = createTabularData(r.name, r.iterations, r.getTotal(), r.getRuns())[r.name]

      return {
        name: r.name,
        total: parseFloat(tabular.total),
        low: parseFloat(tabular.low),
        high: parseFloat(tabular.high),
        median: parseFloat(tabular.median),
        average: parseFloat(tabular.average)
      }
    }
  )

  const output: Record<string, {
    total: number
    low: number
    high: number
    median: number
    average: number
  }> = {}

  merge(output, getRelativeNumbers(reportData, "total"))
  merge(output, getRelativeNumbers(reportData, "low"))
  merge(output, getRelativeNumbers(reportData, "high"))
  merge(output, getRelativeNumbers(reportData, "median"))
  merge(output, getRelativeNumbers(reportData, "average"))

  return output
}

type D = { name: string; total: number; low: number; high: number; median: number; average: number }
type D2 = Record<string, {
  total: number
  low: number
  high: number
  median: number
  average: number
}>

function getRelativeNumbers(input: Array<D>, key: Exclude<keyof D, "name">) {
  const nums = input.slice()
  nums.sort((a, b) => a[key] - b[key])
  const [first, ...rest] = nums
  const baseline = first[key]
  return {
    [first.name]: { [key]: 1 },
    ...Object.fromEntries(rest.map((n) => [n.name, { [key]: Number((n[key] / baseline).toFixed(2)) }]))
  }
}

function merge(d2: D2, d: Record<string, Partial<D>>) {
  for (const [k, v] of Object.entries(d)) {
    d2[k] = { ...d2[k], ...v }
  }
}

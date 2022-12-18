export interface PerformanceTestCase<A> {
  readonly name: string
  readonly init: () => A
  readonly run: (a: A) => unknown | Promise<unknown>
}

export function PerformanceTestCase<A>(
  name: string,
  init: () => A,
  run: (a: A) => Promise<unknown>,
): PerformanceTestCase<A> {
  return { name, init, run }
}

export interface InitResult {
  readonly startTime: number
  readonly endTime: number
}

export interface TestResult {
  readonly startTime: number
  readonly endTime: number
}

export function TestResult(startTime: number, endTime: number): TestResult {
  return { startTime, endTime }
}

export interface TestStats {
  readonly average: number
  readonly min: number
  readonly max: number
  readonly timeToInit: number
  readonly percentile: number
}

export function TestStats(
  average: number,
  min: number,
  max: number,
  timeToInit: number,
  percentile: number,
): TestStats {
  return { average, min, max, timeToInit, percentile }
}

export interface TestSuite {
  readonly name: string
  readonly tests: ReadonlyArray<PerformanceTestCase<any>>
}

export function TestSuite(name: string, tests: ReadonlyArray<PerformanceTestCase<any>>): TestSuite {
  return { name, tests }
}

export interface TestSuiteResult {
  readonly name: string
  readonly stats: Readonly<Record<string, TestStats>>
}

export function TestSuiteResult(
  name: string,
  stats: Readonly<Record<string, TestStats>>,
): TestSuiteResult {
  return { name, stats }
}

export interface RunTestConfig {
  readonly iterations: number
  readonly getTime: () => number
}

export function RunTestConfig(iterations: number, getTime: () => number): RunTestConfig {
  return { iterations, getTime }
}

export function runTestCaseWith(config: RunTestConfig) {
  return async <A>(test: PerformanceTestCase<A>): Promise<Readonly<Record<string, TestStats>>> => {
    const { iterations, getTime } = config
    const initStartTime = getTime()
    const init = test.init()
    const initEndTime = getTime()
    const results: TestResult[] = []

    for (let i = 0; i < iterations; i++) {
      const startTime = getTime()
      await test.run(init)
      const endTime = getTime()
      results.push(TestResult(startTime, endTime))
    }

    return buildStats({
      [test.name]: [
        {
          startTime: initStartTime,
          endTime: initEndTime,
        },
        results,
      ] as const,
    })
  }
}

export async function runTestSuite(
  suite: TestSuite,
  config: RunTestConfig,
): Promise<TestSuiteResult> {
  let results: Record<string, TestStats> = {}
  const runTestCase = runTestCaseWith(config)

  for (const test of suite.tests) {
    results = { ...results, ...(await runTestCase(test)) }
  }

  return TestSuiteResult(suite.name, addPercentile(results))
}

function buildStats(
  results: Record<string, readonly [InitResult, readonly TestResult[]]>,
): Readonly<Record<string, TestStats>> {
  const stats: Record<string, TestStats> = {}

  for (const [name, [initResult, testResults]] of Object.entries(results)) {
    const durations = testResults.map((r) => r.endTime - r.startTime)
    const average = durations.reduce((a, b) => a + b, 0) / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    stats[name] = TestStats(
      roundNumber(average),
      roundNumber(min),
      roundNumber(max),
      roundNumber(initResult.endTime - initResult.startTime),
      -1, // Needs to be calculated later
    )
  }

  return stats
}

function roundNumber(n: number): number {
  return parseFloat(n.toFixed(4))
}

function addPercentile(
  stats: Readonly<Record<string, TestStats>>,
): Readonly<Record<string, TestStats>> {
  const newStats: Record<string, TestStats> = {}

  const fastestToSlowest = Object.entries(stats).sort(([, a], [, b]) => a.average - b.average)
  const fastestTime = fastestToSlowest[0][1].average

  for (let i = 0; i < fastestToSlowest.length; ++i) {
    const [name, stat] = fastestToSlowest[i]
    newStats[name] = TestStats(
      stat.average,
      stat.min,
      stat.max,
      stat.timeToInit,
      roundNumber(stat.average / fastestTime),
    )
  }

  return newStats
}

// TOOO: Return Markdown formatted table as a string

export function printTestSuiteResult(result: TestSuiteResult): void {
  console.log(`Test Suite: ${result.name}`)
  console.table(result.stats)
}

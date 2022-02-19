import { FiberId, prettyFiberId } from '@/FiberId'
import { isNone, Option } from '@/Prelude/Option'
import * as Sync from '@/Prelude/Sync'

export class Trace {
  constructor(
    readonly fiberId: FiberId,
    readonly executionTrace: ReadonlyArray<TraceElement>,
    readonly parentTrace: Option<Trace>,
  ) {}
}

export type TraceElement = NoLocation | SourceLocation

export class NoLocation {
  readonly type = 'NoLocation'
}

export class SourceLocation {
  readonly type = 'SourceLocation'
  constructor(readonly location: string) {}
}

const isSourceLocation = (x: TraceElement): x is SourceLocation => x.type === 'SourceLocation'

export function traceLocation(location?: string): TraceElement {
  if (location) {
    return new SourceLocation(location)
  }

  return new NoLocation()
}

export function prettyTrace(trace: Trace): string {
  return Sync.run(prettyTraceSafe(trace))
}

export function prettyTraceSafe(trace: Trace, parentFiberId?: FiberId): Sync.Sync<string> {
  return Sync.Sync(function* () {
    const executionsWithLocation = trace.executionTrace.filter(isSourceLocation)

    const isRootFiber = trace.fiberId.sequenceNumber === 0

    const stackPrint =
      isRootFiber || isNone(trace.parentTrace)
        ? []
        : [
            `Fiber: ${prettyFiberId(trace.fiberId)} was supposed to continue to Fiber #${
              trace.parentTrace.value.fiberId.sequenceNumber
            }`,
          ]

    const executionTrace = executionsWithLocation.flatMap((a, i) => [
      ...(i === 0 ? [] : ['']),
      `  ${a.location}`,
    ])

    const execPrint =
      executionsWithLocation.length > 0
        ? (parentFiberId && parentFiberId.sequenceNumber !== trace.fiberId.sequenceNumber) ||
          !parentFiberId
          ? [`Fiber: ${prettyFiberId(trace.fiberId)} Execution trace:`, '', ...executionTrace]
          : executionTrace
        : [`Fiber: ${prettyFiberId(trace.fiberId)} Execution trace: <empty trace>`]

    const ancestry = yield* getAncestry(trace, trace.fiberId)

    return [
      stackPrint.length > 0 ? [''] : [],
      ...stackPrint,
      execPrint.length > 0 ? [''] : [],
      ...execPrint,
      ancestry.length > 0 ? [''] : [],
      ...ancestry,
    ].join('\n')
  })
}

const getAncestry = (trace: Trace, fiberId: FiberId) =>
  Sync.Sync(function* () {
    if (isNone(trace.parentTrace)) {
      return [
        `Fiber: ${prettyFiberId(trace.fiberId)} was spawned${
          trace.fiberId.sequenceNumber === 0 ? `.` : ` by: <empty trace>`
        }`,
      ]
    }

    const parentTrace = (yield* prettyTraceSafe(trace.parentTrace.value, trace.fiberId)).trim()

    if (fiberId === trace.fiberId) {
      return lines(parentTrace, '  ').map((s) => s.replace(/\n/g, '  \n'))
    }

    return parentTrace.length === 0
      ? [`Fiber: ${prettyFiberId(trace.fiberId)} was spawned`]
      : [`Fiber: ${prettyFiberId(trace.fiberId)} was spawned by:`, '', ...lines(parentTrace)]
  })

function lines(s: string, prependText = ''): string[] {
  const lines = s.split('\n').map((s) => s.replace('\r', ''))

  if (prependText) {
    const [first, ...rest] = lines

    return [prependText + first, ...rest]
  }

  return lines
}

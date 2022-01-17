import { isNone, isSome, Option } from 'fp-ts/Option'

import { FiberId, prettyFiberId } from '@/FiberId'
import * as Sync from '@/Sync'

export class Trace {
  constructor(
    readonly fiberId: FiberId,
    readonly executionTrace: ReadonlyArray<TraceElement>,
    readonly stackTrace: ReadonlyArray<TraceElement>,
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

export function prettyTraceSafe(trace: Trace): Sync.Sync<string> {
  return Sync.Sync(function* () {
    const stackWithLocation = trace.stackTrace.filter(isSourceLocation)
    const executionsWithLocation = trace.executionTrace.filter(isSourceLocation)

    const isRootFiber = isSome(trace.parentTrace)
      ? trace.parentTrace.value.fiberId === trace.fiberId
      : trace.fiberId.sequenceNumber === 0

    const stackPrint =
      stackWithLocation.length > 0
        ? isRootFiber
          ? []
          : [
              `Fiber: ${prettyFiberId(trace.fiberId)} was supposed to continue to:`,
              '',
              ...stackWithLocation.map((e) => `  a future continuation at ${e.location}`),
            ]
        : [`Fiber: ${prettyFiberId(trace.fiberId)} was supposed to continue to: <empty trace>`]

    const execPrint =
      executionsWithLocation.length > 0
        ? isRootFiber
          ? []
          : [
              `Fiber: ${prettyFiberId(trace.fiberId)} Execution trace:`,
              '',
              ...executionsWithLocation.map((a) => `  ${a.location}`),
            ]
        : [`Fiber: ${prettyFiberId(trace.fiberId)} Execution trace: <empty trace>`]

    const ancestry = yield* getAncestry(trace)

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

const getAncestry = (trace: Trace) =>
  Sync.Sync(function* () {
    if (isNone(trace.parentTrace)) {
      return [`Fiber: ${prettyFiberId(trace.fiberId)} was spawned by: <empty trace>`]
    }

    if (trace.parentTrace.value.fiberId === trace.fiberId) {
      return []
    }

    const parentTrace = (yield* prettyTraceSafe(trace.parentTrace.value)).trim()

    return parentTrace.length === 0
      ? [`Fiber: ${prettyFiberId(trace.fiberId)} was spawned`]
      : [`Fiber: ${prettyFiberId(trace.fiberId)} was spawned by:`, '', ...lines(parentTrace)]
  })

function lines(s: string): string[] {
  return s.split('\n').map((s) => s.replace('\r', ''))
}

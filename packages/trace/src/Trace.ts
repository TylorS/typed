import { getStackFrames, StackFrame } from './StackFrame.js'

export type Trace = EmptyTrace | StackFrameTrace

export interface EmptyTrace {
  readonly tag: 'Empty'
}
export const EmptyTrace: EmptyTrace = { tag: 'Empty' }

export interface StackFrameTrace {
  readonly tag: 'StackFrame'
  readonly stackFrames: readonly StackFrame[]
}

export function StackFrameTrace(stackFrames: readonly StackFrame[]): StackFrameTrace {
  return { tag: 'StackFrame', stackFrames }
}

const INSTRUMENTED_REGEX = /^.+\s.+:[0-9]+:[0-9]+$/i

export const isInstrumentedTrace = (trace: string) => INSTRUMENTED_REGEX.test(trace)

export const custom = (trace: string): StackFrameTrace => {
  if (!isInstrumentedTrace(trace)) {
    return StackFrameTrace([
      {
        tag: 'Custom',
        trace,
      },
    ])
  }

  const [methodFile, line, column] = trace.split(/:/g)
  const [method, file] = methodFile.split(/\s/)
  const stackFrame: StackFrame = {
    tag: 'Instrumented',
    file,
    method,
    line: parseFloat(line),
    column: parseFloat(column),
  }

  return StackFrameTrace([stackFrame])
}

export const runtime = <E extends { stack?: string } = Error>(
  error: E,
  // eslint-disable-next-line @typescript-eslint/ban-types
  targetObject?: Function,
) => StackFrameTrace(getStackFrames(error, targetObject))

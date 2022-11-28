import { Equal } from '@fp-ts/data/Equal'
import { memoHash, hashAll } from '@typed/internal'

export type StackFrame = InstrumentedStackFrame | RuntimeStackFrame | CustomStackFrame

export interface InstrumentedStackFrame extends Equal {
  readonly _tag: 'Instrumented'
  readonly file: string
  readonly method: string
  readonly line: number
  readonly column: number
}

export function InstrumentedStackFrame(
  file: string,
  method: string,
  line: number,
  column: number,
): InstrumentedStackFrame {
  return {
    _tag: 'Instrumented',
    file,
    method,
    line,
    column,
    ...memoHash(() => hashAll('Instrumented', file, method, line, column)),
  }
}

export interface RuntimeStackFrame extends Equal {
  readonly _tag: 'Runtime'
  readonly file: string
  readonly method: string
  readonly line: number
  readonly column: number
}

export function RuntimeStackFrame(
  file: string,
  method: string,
  line: number,
  column: number,
): RuntimeStackFrame {
  return {
    _tag: 'Runtime',
    file,
    method,
    line,
    column,
    ...memoHash(() => hashAll('Runtime', file, method, line, column)),
  }
}

export interface CustomStackFrame extends Equal {
  readonly _tag: 'Custom'
  readonly trace: string
}

export function CustomStackFrame(trace: string): CustomStackFrame {
  return {
    _tag: 'Custom',
    trace,
    ...memoHash(() => hashAll('Custom', trace)),
  }
}

const INSTRUMENTED_REGEX = /^.+\s.+:[0-9]+:[0-9]+$/i
const COLON_REGEX = /:/g
const SPACE_REGEX = /\s/

export const isInstrumentedTrace = (trace: string) => INSTRUMENTED_REGEX.test(trace)

export function parseCustomTrace(trace: string): StackFrame {
  if (isInstrumentedTrace(trace)) {
    const [methodFile, line, column] = trace.split(COLON_REGEX)
    const [method, file] = methodFile.split(SPACE_REGEX)

    return InstrumentedStackFrame(file, method, parseFloat(line), parseFloat(column))
  }

  return CustomStackFrame(trace)
}

import { parseChrome } from './parseChrome.js'
import { parseGecko } from './parseGecko.js'

export type StackFrame = InstrumentedStackFrame | RuntimeStackFrame | CustomStackFrame

export interface InstrumentedStackFrame {
  readonly tag: 'Instrumented'
  readonly file: string
  readonly method: string
  readonly line: number
  readonly column: number
}

export interface RuntimeStackFrame {
  readonly tag: 'Runtime'
  readonly file: string
  readonly method: string
  readonly line: number
  readonly column: number
}

export interface CustomStackFrame {
  readonly tag: 'Custom'
  readonly trace: string
}

export function getStackFrames<E extends { stack?: string } = Error>(
  error: E = {} as E,
  // eslint-disable-next-line @typescript-eslint/ban-types
  targetObject?: Function,
): ReadonlyArray<RuntimeStackFrame> {
  if ('captureStackTrace' in Error) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    ;(Error.captureStackTrace as (error: E, targetObject?: Function) => void)(error, targetObject)
  }

  const stack = error.stack

  if (!stack) {
    return []
  }

  const stackFrames = stack
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x.length !== 0)
    .flatMap((s) => {
      const frame = parseChrome(s) || parseGecko(s)

      return frame ? [frame] : []
    })

  // Append all of the parents traces
  if (error instanceof Error && error.cause) {
    return [...stackFrames, ...getStackFrames(error.cause)]
  }

  return stackFrames
}

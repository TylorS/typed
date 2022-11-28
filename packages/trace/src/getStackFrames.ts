import { RuntimeStackFrame } from './StackFrame.js'
import { parseChrome } from './parseChrome.js'
import { parseGecko } from './parseGecko.js'

export function getStackFrames<E extends { stack?: string } = Error>(
  error: E = {} as E,
  // eslint-disable-next-line @typescript-eslint/ban-types
  targetObject?: Function,
): ReadonlyArray<RuntimeStackFrame> {
  if (!error.stack && 'captureStackTrace' in Error) {
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

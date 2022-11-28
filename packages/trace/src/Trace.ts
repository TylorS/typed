import { Equal, hash, hashRandom } from '@fp-ts/data/Equal'
import { hashAll, memoHash } from '@typed/internal'

import { parseCustomTrace, StackFrame } from './StackFrame.js'
import { getStackFrames } from './getStackFrames.js'

export type Trace = EmptyTrace | StackFrameTrace

export interface EmptyTrace extends Equal {
  readonly _tag: 'Empty'
}
export const EmptyTrace: EmptyTrace = { _tag: 'Empty', ...memoHash(() => hashRandom(EmptyTrace)) }

export interface StackFrameTrace extends Equal {
  readonly _tag: 'StackFrame'
  readonly stackFrames: readonly StackFrame[]
}

export function StackFrameTrace(stackFrames: readonly StackFrame[]): StackFrameTrace {
  return {
    _tag: 'StackFrame',
    stackFrames,
    ...memoHash(() => hashAll('StackFrameTrace', ...stackFrames.map(hash))),
  }
}

export const custom = (trace: string): StackFrameTrace => StackFrameTrace([parseCustomTrace(trace)])

export const runtime = <E extends { stack?: string } = Error>(
  error: E,
  // eslint-disable-next-line @typescript-eslint/ban-types
  targetObject?: Function,
) => StackFrameTrace(getStackFrames(error, targetObject))

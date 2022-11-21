import { StackFrame } from './StackFrame.js'

export type Trace = EmptyTrace | StackFrameTrace

export interface EmptyTrace {
  readonly tag: 'Empty'
}

export interface StackFrameTrace {
  readonly tag: 'StackFrame'
  readonly stackFrames: readonly StackFrame[]
}

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

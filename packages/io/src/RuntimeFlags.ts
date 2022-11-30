export interface RuntimeFlags {
  readonly interruptStatus: boolean
  readonly shouldTrace: boolean
  readonly maxStackTraceCount: number
  readonly maxExecutionTraceCount: number
}

export function RuntimeFlags(overrides: Partial<RuntimeFlags> = {}): RuntimeFlags {
  return {
    interruptStatus: true,
    shouldTrace: true,
    maxStackTraceCount: 50,
    maxExecutionTraceCount: 10,
    ...overrides,
  }
}

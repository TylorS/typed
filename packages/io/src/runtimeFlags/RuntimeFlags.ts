export interface RuntimeFlags {
  readonly interruptStatus: boolean
  readonly shouldTrace: boolean
  readonly executionTraceLimit: number
  readonly stackTraceLimit: number
}

export function RuntimeFlags(overrides: Partial<RuntimeFlags> = {}): RuntimeFlags {
  return {
    interruptStatus: true,
    shouldTrace: true,
    executionTraceLimit: 10,
    stackTraceLimit: 40,
    ...overrides,
  }
}

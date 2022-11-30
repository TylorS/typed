export interface RuntimeFlags {
  readonly interruptStatus: boolean
  readonly shouldTrackExecutionTrace: boolean
  readonly executionTraceLimit: number
  readonly shouldTrackStackTrace: boolean
  readonly stackTraceLimit: number
}

export function RuntimeFlags(overrides: Partial<RuntimeFlags> = {}): RuntimeFlags {
  return {
    ...RuntimeFlags.defaults,
    ...overrides,
  }
}

RuntimeFlags.defaults = {
  interruptStatus: true,
  shouldTrackExecutionTrace: true,
  executionTraceLimit: 10,
  shouldTrackStackTrace: true,
  stackTraceLimit: 40,
} satisfies RuntimeFlags

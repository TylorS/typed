export interface RuntimeFlags {
  readonly interruptStatus: boolean
  readonly shouldTrace: boolean
  readonly maxTraceCount: number
}

export function RuntimeFlags(overrides: Partial<RuntimeFlags> = {}): RuntimeFlags {
  return {
    interruptStatus: true,
    shouldTrace: true,
    maxTraceCount: 50,
    ...overrides,
  }
}

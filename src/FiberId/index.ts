// A FiberID can be a string, number, Symbol.for, or a Symbol with a description.
export interface FiberId {
  readonly startTime: number
  readonly sequenceNumber: number
}

export function makeFiberId(sequenceNumber: number, startTime: number = Date.now()): FiberId {
  return {
    startTime,
    sequenceNumber,
  }
}

export function prettyFiberId(id: FiberId): string {
  return `#${id.sequenceNumber} (started at: ${new Date(id.startTime).toISOString()})`
}

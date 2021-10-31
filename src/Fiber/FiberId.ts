/**
 * Unique Id of a Fiber
 */
export interface FiberId {
  readonly startTime: number
  readonly sequenceNumber: number
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FiberId {
  export const make = (startTime: number, sequenceNumber: number): FiberId => {
    return {
      startTime,
      sequenceNumber,
    }
  }
}

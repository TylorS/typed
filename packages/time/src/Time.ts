import { unsafeCoerce } from '@fp-ts/data/Function'

/**
 * A monotonic representation to Time. It is always relative to a specific
 * "start time".
 */
export type Time = number & TIME

/**
 * Constructor for Time
 */
export const Time: (time: number) => Time = unsafeCoerce

/**
 * A Brand for Time
 */
export interface TIME {
  readonly TIME: unique symbol
}

/**
 * A UnixTime is a representation of time in milliseconds since the Unix Epoch.
 */
export type UnixTime = number & UNIX_TIME

/**
 * Constructor for UnixTime
 */
export const UnixTime: (time: number) => UnixTime = unsafeCoerce

/**
 * The minimum UnixTime
 */
export const MIN_UNIX_TIME = UnixTime(0)

/**
 * The maximum UnixTime represenable by a 32-bit number
 */
export const MAX_UNIX_TIME = UnixTime(8.64e15) // WHAT WILL WE DO AFTER +275760-09-13T00:00:00.000Z???

/**
 * A Brand for UnixTime
 */
export interface UNIX_TIME {
  readonly UNIX_TIME: unique symbol
}

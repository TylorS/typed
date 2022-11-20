import { unsafeCoerce } from '@fp-ts/data/Function'

export type Time = number & TIME

export const Time: (time: number) => Time = unsafeCoerce

export interface TIME {
  readonly TIME: unique symbol
}

export type UnixTime = number & UNIX_TIME

export const UnixTime: (time: number) => UnixTime = unsafeCoerce

export const MIN_UNIX_TIME = UnixTime(0)
export const MAX_UNIX_TIME = UnixTime(8.64e15) // WHAT WILL WE DO AFTER +275760-09-13T00:00:00.000Z???

export interface UNIX_TIME {
  readonly UNIX_TIME: unique symbol
}

import { IO } from 'fp-ts/IO'

export interface Clock {
  readonly getCurrentTime: IO<Time>
}

/**
 * Non-negative integer
 */
export type Time = number

export const relative = (clock: Clock, offset: Time = clock.getCurrentTime()): Clock => ({
  getCurrentTime: () => clock.getCurrentTime() - offset,
})

export const dateClock: Clock = {
  getCurrentTime: () => Date.now(),
}

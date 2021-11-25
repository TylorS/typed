import { IO } from 'fp-ts/IO'

import { Branded } from '@/Branded'

export interface Clock {
  readonly getCurrentTime: IO<Time>
}

/**
 * Non-negative integer
 */
export type Time = Branded<number, 'Time'>
export const Time = Branded<Time>()

export const relative = (clock: Clock, offset: Time = clock.getCurrentTime()): Clock => ({
  getCurrentTime: () => Time(clock.getCurrentTime() - offset),
})

export const dateClock: Clock = {
  getCurrentTime: () => Time(Date.now()),
}

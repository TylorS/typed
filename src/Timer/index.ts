import { Clock, Time } from '@/Clock'
import { Disposable, Sync } from '@/Disposable'

export interface Timer extends Clock {
  readonly delay: (f: (time: Time) => void, delay: number) => Disposable
}

export const makeSetTimeoutTimer = (clock: Clock): Timer => ({
  ...clock,
  delay: (f, delay) => {
    const id = setTimeout(() => f(clock.getCurrentTime()), delay)

    return Sync(() => clearTimeout(id))
  },
})

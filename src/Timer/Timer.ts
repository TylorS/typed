import { Clock, dateClock, Time } from '@/Clock'
import { Disposable } from '@/Disposable'

export interface Timer extends Clock {
  readonly delay: (f: () => any, ms: Time) => Disposable
}

export const makeTimeoutTimer = (clock: Clock = dateClock): Timer => ({
  getCurrentTime: clock.getCurrentTime,
  delay: (f, ms) => {
    const id = setTimeout(f, ms)

    return {
      dispose: () => clearTimeout(id),
    }
  },
})

import { Tag } from '@fp-ts/data/Context'
import { Duration } from '@fp-ts/data/Duration'
import { Clock } from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { Time } from '@typed/time'

export interface Timer extends Clock {
  readonly setTimer: (f: (time: Time) => void, delay: Duration) => Disposable
  readonly fork: () => Timer
}

// All modern browser and server environments include setImmediate + clearImmediate
declare const setImmediate: typeof setTimeout
declare const clearImmediate: typeof clearTimeout

export const Timer = Object.assign(function makeTimer(clock: Clock = Clock()): Timer {
  return {
    ...clock,
    setTimer: (callback, delay) => {
      if (delay.millis < 1) {
        const id = setImmediate(callback)

        return Disposable(() => clearImmediate(id))
      }

      const id = setTimeout(callback, delay.millis)

      return Disposable(() => clearTimeout(id))
    },
    fork: () => makeTimer(clock.fork()),
  }
}, Tag<Timer>())

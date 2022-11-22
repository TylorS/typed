import { Clock, makeDateClock } from '@typed/clock'
import { Disposable } from '@typed/disposable/Disposable'

import { Timer } from './Timer.js'

// All modern browser and server environments include setImmediate + clearImmediate
declare const setImmediate: typeof setTimeout
declare const clearImmediate: typeof clearTimeout

export function makeTimer(clock: Clock = makeDateClock()): Timer {
  return {
    ...clock,
    delay: (callback, delay) => {
      if (delay.millis < 1) {
        const id = setImmediate(callback)

        return Disposable(() => clearImmediate(id))
      }

      const id = setTimeout(callback, delay.millis)

      return Disposable(() => clearTimeout(id))
    },
    fork: () => makeTimer(clock.fork()),
  }
}

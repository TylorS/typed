import { flow } from '@fp-ts/data/Function'
import { Time, UnixTime } from '@typed/time'
import { makeTimeline } from '@typed/timeline'
import { Timer } from '@typed/timer'
import { Disposable } from 'packages/disposable/dist/Disposable.js'

import { makeTestClock, TestClock } from './TestClock.js'

/**
 * A Timer which provides imperative access to progressing Time forward.
 */
export interface TestTimer extends Timer, TestClock {
  readonly fork: () => TestTimer
}

export function makeTestTimer(clock: TestClock = makeTestClock(), autoRun = true): TestTimer {
  const timeline = makeTimeline<(t: Time) => void>()
  const runReadyTimers = (t: Time) => (
    timeline.getReadyTasks(UnixTime(clock.startTime + t)).forEach((f) => f(t)), t
  )

  return {
    ...clock,
    delay: (f, delay) => {
      // If auto-run is enabled an delay is 0,
      // synchronously run the callback.
      if (autoRun && delay.millis === 0) {
        f(clock.time.get())

        return Disposable.unit
      }

      return timeline.add(clock.unixTime.delay(delay), f)
    },
    progressTimeBy: flow(clock.progressTimeBy, runReadyTimers),
    fork: () => makeTestTimer(clock.fork(), autoRun),
  }
}

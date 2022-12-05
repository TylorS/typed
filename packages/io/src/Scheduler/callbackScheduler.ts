import { millis } from '@fp-ts/data/Duration'
import { getTime } from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { UnixTime } from '@typed/time'
import { Timeline } from '@typed/timeline'
import { Timer } from '@typed/timer'

export function callbackScheduler(
  timer: Timer,
): readonly [Disposable, (time: UnixTime, f: () => void) => Disposable] {
  const timeline = Timeline<() => void>(scheduleNextRun)
  let disposable: Disposable = Disposable.unit
  let nextArrival: UnixTime | null = null

  function scheduleNextRun() {
    // If the timeline is empty, lets cleanup our resources
    if (timeline.isEmpty()) {
      disposable.dispose()
      nextArrival = null

      return
    }

    // Get the time of the next arrival currently in the Timeline
    const next = timeline.nextArrival()
    const needToScheduleEarlierTime = !nextArrival || nextArrival > next

    // If we need to create or schedule an earlier time, cleanup the old timer
    // and schedule the new one.
    if (needToScheduleEarlierTime) {
      disposable.dispose()
      disposable = timer.setTimer(runReadyTasks, millis(next - getTime(timer)))
      nextArrival = next
    }
  }

  function runReadyTasks() {
    timeline.getReadyTasks(timer.getUnixTime()).forEach((f) => f())

    scheduleNextRun()
  }

  return [Disposable(() => disposable.dispose()), timeline.add] as const
}

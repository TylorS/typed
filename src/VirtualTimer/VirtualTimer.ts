import { Disposable, Handle, Timer } from '@most/types'
import { Arity1 } from '@typed/fp/common/exports'
import { IO } from 'fp-ts/IO'

import { Timeline } from './Timeline'
import { createVirtualClock, VirtualClock } from './VirtualClock'

export interface VirtualTimer extends Timer, VirtualClock, Disposable {}

export function createVirtualTimer(clock: VirtualClock = createVirtualClock()): VirtualTimer {
  const timeline = new Timeline()

  function delay(delayMS: number, f: Arity1<number>): Disposable {
    const time = clock.now() + delayMS

    timeline.addTask(time, f)

    return { dispose: () => timeline.removeTask(time, f) }
  }

  function runTasks() {
    const currentTime = clock.now()
    const tasks = timeline.readyTasks(currentTime)

    tasks.forEach((task) => task(currentTime))
  }

  let id = 0
  const disposables = new Map<Handle, Disposable>()

  function setTimer(f: IO<void>, delayMS: number): Handle {
    const handle = id++

    disposables.set(
      handle,
      delay(delayMS, () => {
        disposables.delete(handle)
        f()
      }),
    )

    return handle
  }

  function clearTimer(handle: Handle) {
    disposables.get(handle)?.dispose()
  }

  function dispose() {
    disposables.forEach((d) => d.dispose())
    disposables.clear()
  }

  return {
    ...clock,
    setTimer,
    clearTimer,
    dispose,
    progressTimeBy: (elapsed) => {
      const time = clock.progressTimeBy(elapsed)

      runTasks()

      return time
    },
  }
}

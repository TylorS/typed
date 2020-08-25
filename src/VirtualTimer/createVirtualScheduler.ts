import { newScheduler, newTimeline } from '@most/scheduler'

import { createVirtualClock, VirtualClock } from './VirtualClock'
import { createVirtualTimer } from './VirtualTimer'

export const createVirtualScheduler = () => {
  const clock: VirtualClock = createVirtualClock()
  const scheduler = newScheduler(createVirtualTimer(clock), newTimeline())

  return [clock, scheduler] as const
}

import { newScheduler, newTimeline } from '@most/scheduler'

import { createVirtualTimer, VirtualTimer } from './VirtualTimer'

export const createVirtualScheduler = () => {
  const timer: VirtualTimer = createVirtualTimer()
  const scheduler = newScheduler(timer, newTimeline())

  return [timer, scheduler] as const
}

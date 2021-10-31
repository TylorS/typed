import * as Scheduler from '@/Scheduler'

import { Context } from './Context'

export function relative(context: Context): Context {
  return {
    ...context,
    scheduler: Scheduler.relative(context.scheduler),
  }
}

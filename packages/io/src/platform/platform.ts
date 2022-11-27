import { Scheduler } from '../scheduler/index.js'

export interface Platform {
  readonly scheduler: Scheduler
  readonly nextId: () => number
  readonly fork: () => Platform
}

export function Platform(scheduler: Scheduler = Scheduler()): Platform {
  let id = 0

  const platform: Platform = {
    scheduler,
    nextId: () => id++,
    fork: () => ForkPlatform(platform, scheduler.fork()),
  }

  return platform
}

function ForkPlatform(platform: Platform, scheduler: Scheduler): Platform {
  return {
    scheduler,
    nextId: platform.nextId,
    fork: () => ForkPlatform(platform, scheduler.fork()),
  }
}

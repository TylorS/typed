import { Clock, DateClock, relative, Time } from '@/Clock'
import * as D from '@/Disposable'
import { fromInstructionProcessor } from '@/Fiber/fromInstructionProcessor'
import { Runtime, RuntimeOptions } from '@/Fiber/Runtime'
import { RuntimeProcessor } from '@/Fiber/RuntimeProcessor'
import * as Fx from '@/Fx'
import { join } from '@/Fx'
import { None, Option, Some } from '@/Prelude/Option'
import { StreamContext } from '@/Stream'
import { makeSetTimeoutTimer, Timer } from '@/Timer'

import { accountForTimeDrift } from './accountForTimeDrift'
import { Scheduler } from './Scheduler'
import { Timeline } from './Timeline'

export type SchedulerOptions = {
  readonly timer?: Timer
  readonly timeline?: Timeline<RuntimeProcessor<any, any>>
  readonly runtimeOptions?: RuntimeOptions<any>
}

export function make(options: SchedulerOptions = {}): Scheduler {
  const timer = options.timer ?? makeSetTimeoutTimer(relative(DateClock))

  let disposable: D.Disposable = D.None

  const runReadyTasks = (events: readonly RuntimeProcessor<any, any>[]) =>
    events.forEach((event) => event.processNow())

  const scheduleNextRun = async () => {
    await D.dispose(disposable)

    if (timeline.isEmpty()) {
      disposable = D.None

      return
    }

    disposable = timer.delay(
      (time) => runReadyTasks(timeline.getReadyTasks(time)),
      timeline.nextArrival() - timer.getCurrentTime(),
    )
  }

  const timeline = options.timeline ?? new Timeline<RuntimeProcessor<any, any>>(scheduleNextRun)

  return {
    getCurrentTime: timer.getCurrentTime,
    asap: makeAsap(options.runtimeOptions),
    delay: makeDelay(timer, timeline, options.runtimeOptions),
    periodic: makePeriodic(timer, timeline, options.runtimeOptions),
  }
}

export function makeAsap(options?: RuntimeOptions<any>): Scheduler['asap'] {
  return (fx, context) =>
    new Runtime(context.resources, {
      ...options,
      fiberContext: context.fiberContext,
      scope: context.scope,
    }).runFiber(fx)
}

export function makeDelay(
  clock: Clock,
  timeline: Timeline<RuntimeProcessor<any, any>>,
  options?: RuntimeOptions<any>,
): Scheduler['delay'] {
  return <R, E, A>(delay: number, fx: Fx.Fx<R, E, A>, context: StreamContext<R, E>) => {
    const time = Time(clock.getCurrentTime() + delay)
    const runtime = new Runtime(context.resources, {
      ...options,
      fiberContext: context.fiberContext,
      scope: context.scope,
    })
    const processor = runtime.makeProcessor<E, A>(fx)
    const fiber = fromInstructionProcessor(processor, (r) => timeline.add(time, r))

    return fiber
  }
}

export function makePeriodic(
  clock: Clock,
  timeline: Timeline<RuntimeProcessor<any, any>>,
  options?: RuntimeOptions<any>,
): Scheduler['periodic'] {
  return <R, E, A>(period: number, fx: Fx.Fx<R, E, A>, context: StreamContext<R, E>) => {
    const runtime = new Runtime(context.resources, {
      ...options,
      fiberContext: context.fiberContext,
      scope: context.scope,
    })

    let previousTime: Option<Time> = None
    const next = () => {
      const time = accountForTimeDrift(previousTime, clock.getCurrentTime(), period)
      previousTime = Some(time)
      const processor = runtime.makeProcessor<E, A>(fx)
      const fiber = fromInstructionProcessor(processor, (r) => timeline.add(time, r))

      return fiber
    }

    return runtime.runFiber(
      Fx.Fx(function* () {
        while (true) {
          yield* join(next())
        }
      }),
    )
  }
}

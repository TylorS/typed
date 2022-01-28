import { none, Option, some } from 'fp-ts/Option'

import { Clock, DateClock, relative, Time } from '@/Clock'
import * as D from '@/Disposable'
import { fromInstructionProcessor } from '@/Fiber/fromInstructionProcessor'
import { Runtime, RuntimeOptions } from '@/Fiber/Runtime'
import { RuntimeProcessor } from '@/Fiber/RuntimeProcessor'
import { FiberContext } from '@/FiberContext'
import * as Fx from '@/Fx'
import { join } from '@/Fx'
import { Scope } from '@/Scope'
import { makeSetTimeoutTimer, Timer } from '@/Timer'

import { accountForTimeDrift } from './accountForTimeDrift'
import { Scheduler } from './Scheduler'
import { Timeline } from './Timeline'

export type SchedulerOptions = {
  readonly timer?: Timer
  readonly timeline?: Timeline<FxEvent>
  readonly runtimeOptions?: RuntimeOptions<any>
}

export type FxEvent = RuntimeProcessor<any, any>

export function make(options: SchedulerOptions = {}): Scheduler {
  const timer = options.timer ?? makeSetTimeoutTimer(relative(DateClock))

  let disposable: D.Disposable = D.none

  const runReadyTasks = (events: readonly FxEvent[]) =>
    events.forEach((event) => event.processNow())

  const scheduleNextRun = async () => {
    await D.dispose(disposable)

    if (timeline.isEmpty()) {
      disposable = D.none

      return
    }

    disposable = timer.delay(
      (time) => runReadyTasks(timeline.getReadyTasks(time)),
      timeline.nextArrival() - timer.getCurrentTime(),
    )
  }

  const timeline = options.timeline ?? new Timeline<FxEvent>(scheduleNextRun)

  return {
    getCurrentTime: timer.getCurrentTime,
    asap: makeAsap(options.runtimeOptions),
    delay: makeDelay(timer, timeline, options.runtimeOptions),
    periodic: makePeriodic(timer, timeline, options.runtimeOptions),
  }
}

export function makeAsap(options?: RuntimeOptions<any>): Scheduler['asap'] {
  return (fx, resources, context, scope) =>
    new Runtime(resources, { ...options, context, scope }).runFiber(fx)
}

export function makeDelay(
  clock: Clock,
  timeline: Timeline<FxEvent>,
  options?: RuntimeOptions<any>,
): Scheduler['delay'] {
  return <R, E, A>(
    delay: number,
    fx: Fx.Fx<R, E, A>,
    resources: R,
    context: FiberContext<E>,
    scope: Scope<E, A>,
  ) => {
    const time = Time(clock.getCurrentTime() + delay)
    const runtime = new Runtime(resources, { ...options, context, scope })
    const processor = runtime.makeProcessor<E, A>(fx)
    const fiber = fromInstructionProcessor(processor, (r) => timeline.add(time, r))

    return fiber
  }
}

export function makePeriodic(
  clock: Clock,
  timeline: Timeline<FxEvent>,
  options?: RuntimeOptions<any>,
): Scheduler['periodic'] {
  return <R, E, A>(
    period: number,
    fx: Fx.Fx<R, E, A>,
    resources: R,
    context: FiberContext<E>,
    scope: Scope<E, A>,
  ) => {
    const runtime = new Runtime(resources, { ...options, context, scope })

    let previousTime: Option<Time> = none
    const next = () => {
      const time = accountForTimeDrift(previousTime, clock.getCurrentTime(), period)
      previousTime = some(time)
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

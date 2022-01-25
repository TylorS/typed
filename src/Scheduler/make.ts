import { isLeft } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { isDisposed } from '@/Cause'
import { Clock, DateClock, relative, Time } from '@/Clock'
import { Context } from '@/Context'
import * as D from '@/Disposable'
import { Runtime, RuntimeOptions } from '@/Fiber/Runtime'
import { RuntimeProcessor } from '@/Fiber/RuntimeProcessor'
import { complete, pending, wait } from '@/Future'
import * as Fx from '@/Fx'
import { Scope } from '@/Scope'
import { makeSetTimeoutTimer, Timer } from '@/Timer'

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
    context: Context<E>,
    scope: Scope<E, A>,
  ) => {
    const time = Time(clock.getCurrentTime() + delay)
    const runtime = new Runtime(resources, { ...options, context, scope })
    const processor = runtime.makeProcessor<E, A>(fx)
    const runtimeProcessor = new RuntimeProcessor(
      processor,
      processor.captureStackTrace,
      processor.shouldTrace,
      processor.scope.interruptableStatus,
    )
    const future = pending<R, E, A>()

    // Complete the future when processor finishes
    runtimeProcessor.addObserver((exit) => pipe(future, complete<R, E, A>(Fx.fromExit<E, A>(exit))))

    // Cleanup on dispose
    runtimeProcessor.addObserver(
      (exit) => isLeft(exit) && isDisposed(exit.left) && timeline.remove(time, runtimeProcessor),
    )

    timeline.add(time, runtimeProcessor)

    return runtime.runFiber(wait(future))
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
    context: Context<E>,
    scope: Scope<E, A>,
  ) => {
    const runtime = new Runtime(resources, { ...options, context, scope })

    let previousTime: Time | null = null

    const accountForTimeDrift = () => {
      if (!previousTime) {
        const time = Time(clock.getCurrentTime() + period)

        previousTime = time

        return time
      }

      return Time(previousTime + period)
    }

    const setupFuture = () => {
      const time = accountForTimeDrift()
      const processor = runtime.makeProcessor<E, A>(fx)
      const runtimeProcessor = new RuntimeProcessor(
        processor,
        processor.captureStackTrace,
        processor.shouldTrace,
        processor.scope.interruptableStatus,
      )
      const future = pending<R, E, A>()

      // Complete the future when processor finishes
      runtimeProcessor.addObserver((exit) =>
        pipe(future, complete<R, E, A>(Fx.fromExit<E, A>(exit))),
      )

      timeline.add(time, runtimeProcessor)

      // Cleanup on dispose
      runtimeProcessor.addObserver(
        (exit) => isLeft(exit) && isDisposed(exit.left) && timeline.remove(time, runtimeProcessor),
      )

      return future
    }

    return runtime.runFiber(
      Fx.Fx(function* () {
        while (true) {
          yield* wait(setupFuture(), 'Periodic Wait')
        }
      }),
    )
  }
}

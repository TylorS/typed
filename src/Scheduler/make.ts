import { pipe } from 'fp-ts/function'

import { Clock, Time } from '@/Clock'
import { Context } from '@/Context'
import { InstructionProcessor, Runtime, RuntimeOptions } from '@/Fiber'
import { complete, pending, wait } from '@/Future'
import * as Fx from '@/Fx'
import { Scope } from '@/Scope'

import { Scheduler } from './Scheduler'
import { Timeline } from './Timeline'

export type SchedulerOptions = {
  readonly clock: Clock
  readonly timeline?: Timeline<FxEvent>
  readonly runtimeOptions?: RuntimeOptions
}

export type FxEvent = {
  readonly fx: Fx.Fx<any, any, any>
  readonly runtime: Runtime<any>
  processor: InstructionProcessor<any, any, any>
}

// TODO: Handle scheduling timeline runs
export function make(options: SchedulerOptions): Scheduler {
  const timeline = options.timeline ?? new Timeline<FxEvent>()

  return {
    getCurrentTime: options.clock.getCurrentTime,
    asap: makeAsap(options.runtimeOptions),
    delay: makeDelay(options.clock, timeline, options.runtimeOptions),
    periodic: makePeriodic(options.clock, timeline, options.runtimeOptions),
  }
}

export function makeAsap(options?: RuntimeOptions): Scheduler['asap'] {
  return (fx, resources, context, scope) => {
    const runtime = new Runtime(resources, { ...options, context, scope })

    return runtime.runFiber(fx)
  }
}

export function makeDelay(
  clock: Clock,
  timeline: Timeline<FxEvent>,
  options?: RuntimeOptions,
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
    const future = pending<R, E, A>()

    // Complete the future when processor finishes
    processor.addObserver((exit) => pipe(future, complete<R, E, A>(Fx.fromExit<E, A>(exit))))

    timeline.add(time, { fx, runtime, processor })

    return runtime.runFiber(wait(future))
  }
}

// TODO: Implement periodic scheduling
export function makePeriodic(
  clock: Clock,
  timeline: Timeline<FxEvent>,
  options?: RuntimeOptions,
): Scheduler['periodic'] {
  return makeDelay(clock, timeline, options) as Scheduler['periodic']
}

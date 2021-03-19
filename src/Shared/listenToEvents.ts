import { Disposable } from '@most/types'
import { SchedulerEnv } from '@typed/fp/stream'
import { constVoid } from 'fp-ts/dist/function'

import { Shared } from './Shared'
import { EffectOf, SharedEvent } from './SharedEvent'

export function listenToEvents<F, H extends ReadonlyArray<RuntimeHandler<F>>>(
  env: Shared<F> & SchedulerEnv,
  handlers: H,
): Disposable {
  const respondToEvent = (event: SharedEvent<F>) => {
    for (const { guard, handler } of handlers) {
      if (guard(event)) {
        env.queuedEffects.push([event.namespace, handler(event)])
      }
    }
  }

  return env.sharedEvents[1].run(
    { event: (_, x) => respondToEvent(x), error: constVoid, end: constVoid },
    env.scheduler,
  )
}

export interface RuntimeHandler<F, A extends SharedEvent<F> = SharedEvent<F>> {
  readonly guard: (event: SharedEvent<F>) => event is A
  readonly handler: (event: A) => EffectOf<F, Shared<F>>
}

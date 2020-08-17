import { doEffect, Effect, SchedulerEnv } from '../Effect'
import { UuidEnv } from '../Uuid'
import { createHookEnvironment } from './createHookEnvironment'
import { HookEnv } from './HookEnvironment'

export const runWithHooks = <E, A>(
  effect: Effect<E & HookEnv, A>,
): Effect<E & Partial<HookEnv> & UuidEnv & SchedulerEnv, A> =>
  doEffect(function* () {
    const hookEnvironment = yield* createHookEnvironment()

    return yield* hookEnvironment.runWith(effect)
  })

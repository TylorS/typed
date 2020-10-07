import { ask, doEffect, Effect, EnvOf, execPure, provideWith, use } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { UuidEnv } from '@typed/fp/Uuid/common'
import { pipe } from 'fp-ts/function'

import { listenToHookEvents, removeHookEnvironment } from '../sharedRefs/exports'
import { isRemovedHookEnvironmentEvent } from '../types/events'
import { createHookEnv, HookEnv } from '../types/HookEnvironment'
import { HookRefEnvs } from './provideHookStates'

/**
 * Provide the root hook environment
 */
export const provideHookEnv: <E, A>(
  effect: Effect<HookEnv & E, A>,
) => Effect<E & HookRefEnvs & UuidEnv & SchedulerEnv, A> = provideWith(
  doEffect(function* () {
    const hookEnv = yield* createHookEnv
    const env = yield* ask<EnvOf<typeof removeHookEnvironment>>()

    yield* pipe(
      listenToHookEvents(isRemovedHookEnvironmentEvent, (ev) =>
        pipe(removeHookEnvironment(ev.hookEnvironment), use(env), execPure),
      ),
      use(hookEnv),
    )

    return hookEnv
  }),
)

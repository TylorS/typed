import { ask, doEffect, Effect, EnvOf, execPure, provideWith, use } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { UuidEnv } from '@typed/fp/Uuid/common'
import { pipe } from 'fp-ts/function'

import { isRemovedHookEnvironmentEvent } from './events'
import { createHookEnv, HookEnv } from './HookEnvironment'
import { listenToHookEvents } from './HookEvents'
import { HookRefEnvs } from './provideHookStates'
import { removeHookEnvironment } from './removeHookEnvironment'

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

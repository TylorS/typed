import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { useSome } from '@typed/fp/Effect/provide'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { curry } from '@typed/fp/lambda/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/function'

import { HookEvents, HookPositions, resetIndex, sendHookEvent } from '../sharedRefs/exports'
import { RunningHookEnvironment } from '../types/events'
import { HookEnv } from '../types/HookEnvironment'
import { HookEnvironment } from '../types/HookEnvironment'

export const runWithHooks = curry(
  <E, A>(
    hookEnvironment: HookEnvironment,
    effect: Effect<HookEnv & E, A>,
  ): Effect<E & SchedulerEnv & SharedRefEnv<HookEvents> & SharedRefEnv<HookPositions>, A> =>
    doEffect(function* () {
      yield* resetIndex(hookEnvironment.id) // Ensure indexed states always reset
      yield* sendHookEvent(RunningHookEnvironment.of(hookEnvironment))

      return yield* pipe(
        effect,
        useSome<HookEnv>({ hookEnvironment }),
      )
    }),
) as {
  <E, A>(hookEnvironment: HookEnvironment, effect: Effect<HookEnv & E, A>): Effect<
    E & SchedulerEnv & SharedRefEnv<HookEvents> & SharedRefEnv<HookPositions>,
    A
  >
  (hookEnvironment: HookEnvironment): <E, A>(
    effect: Effect<HookEnv & E, A>,
  ) => Effect<E & SchedulerEnv & SharedRefEnv<HookEvents> & SharedRefEnv<HookPositions>, A>
}

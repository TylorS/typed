import { Effect } from '@typed/fp/Effect/Effect'
import { provideSchedulerEnv, SchedulerEnv } from '@typed/fp/fibers/exports'
import { UuidEnv } from '@typed/fp/Uuid/common'
import { provideNodeUuidEnv } from '@typed/fp/Uuid/provideNodeUuidEnv'
import { pipe } from 'fp-ts/function'

import { HookEnv } from '../types/exports'
import { provideHookEnv } from './provideHookEnv'
import { HookRefEnvs, provideEmptyHookStates } from './provideHookStates'

/**
 * Provide all the hook requirements for a node environment
 */
export const provideNodeHooks = <E, A>(
  eff: Effect<E & HookEnv & HookRefEnvs & SchedulerEnv & UuidEnv, A>,
): Effect<E, A> =>
  pipe(eff, provideHookEnv, provideEmptyHookStates, provideSchedulerEnv, provideNodeUuidEnv)

import { Effect } from '@typed/fp/Effect/Effect'
import { provideSchedulerEnv, SchedulerEnv } from '@typed/fp/fibers/exports'
import { provideBrowserUuidEnv, UuidEnv } from '@typed/fp/Uuid/exports'
import { pipe } from 'fp-ts/function'

import { HookEnv, HookRefEnvs, provideEmptyHookStates, provideHookEnv } from '../exports'

/**
 * Provide all the hook requirements for a browser environment
 */
export const provideBrowserHooks = <E, A>(
  eff: Effect<E & HookEnv & HookRefEnvs & SchedulerEnv & UuidEnv, A>,
): Effect<E, A> =>
  pipe(eff, provideHookEnv, provideEmptyHookStates, provideSchedulerEnv, provideBrowserUuidEnv)

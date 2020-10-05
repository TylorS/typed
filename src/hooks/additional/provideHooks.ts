import { Effect } from '@typed/fp/Effect/Effect'
import { provideSchedulerEnv, SchedulerEnv } from '@typed/fp/fibers/exports'
import {
  provideBrowserUuidEnv,
  provideNodeUuidEnv,
  provideUuidEnv,
  UuidEnv,
} from '@typed/fp/Uuid/exports'
import { pipe } from 'fp-ts/function'

import { HookEnv, HookRefEnvs, provideEmptyHookStates, provideHookEnv } from '../core/exports'

/**
 * Provide all the hook requirements for a browser environment
 */
export const provideBrowserHooks = <E, A>(
  eff: Effect<E & HookEnv & HookRefEnvs & SchedulerEnv & UuidEnv, A>,
): Effect<E, A> =>
  pipe(eff, provideHookEnv, provideEmptyHookStates, provideSchedulerEnv, provideBrowserUuidEnv)

/**
 * Provide all the hook requirements for a node environment
 */
export const provideNodeHooks = <E, A>(
  eff: Effect<E & HookEnv & HookRefEnvs & SchedulerEnv & UuidEnv, A>,
): Effect<E, A> =>
  pipe(eff, provideHookEnv, provideEmptyHookStates, provideSchedulerEnv, provideNodeUuidEnv)

/**
 * Provide all the hook requirements for a node environment
 */
export const provideHooks = <E, A>(
  eff: Effect<E & HookEnv & HookRefEnvs & SchedulerEnv & UuidEnv, A>,
): Effect<E, A> =>
  pipe(eff, provideHookEnv, provideEmptyHookStates, provideSchedulerEnv, provideUuidEnv)

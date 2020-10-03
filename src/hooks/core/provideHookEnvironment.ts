import { map, memo, provideWith, useWith } from '@typed/fp/Effect/exports'

import { createChildHookEnvironment, HookEnv } from './HookEnvironment'

const createEnv = map(
  (hookEnvironment): HookEnv => ({ hookEnvironment }),
  createChildHookEnvironment,
)

/**
 * Provide the root hook environment
 */
export const provideHookEnv = provideWith(memo(createEnv))

/**
 *
 */
export const useHookEnv = useWith(createEnv)

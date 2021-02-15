import { Env } from '@fp/Env'
import { asks } from 'fp-ts/Reader'

import { FailEnv } from './FailEnv'

/**
 * Place a FailEnv requirement onto the environment
 */
export const throwError = <Name extends PropertyKey>(name: Name) => <E>(
  error: E,
): Env<FailEnv<Name, E>, never> => asks((e: FailEnv<Name, E>) => e[name](error))

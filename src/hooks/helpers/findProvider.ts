import { isSome } from 'fp-ts/Option'

import { HookEnvironment, HookEnvironmentId } from '../core/types/HookEnvironment'
import { State } from '../core/types/State'

/**
 * Finds the closest provider, or root of tree withing a specific
 * channel.
 */
export function findProvider(
  env: HookEnvironment,
  providers: Map<HookEnvironmentId, State<any, any>>,
): HookEnvironment {
  let current = env

  while (!providers.has(current.id) && isSome(current.parent)) {
    current = current.parent.value
  }

  return current
}

import { isSome } from 'fp-ts/Option'

import { HookEnvironment, HookEnvironmentId } from './HookEnvironment'
import { State } from './State'

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

import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { createUuid, UuidEnv } from '@typed/fp/Uuid/exports'

import {
  getKeyedEnvironment,
  HookDisposables,
  HookEnv,
  HookEnvironment,
  HookPositions,
  HookSymbols,
  useRef,
} from '../core/exports'

export const useHookEnvironmentRef: Effect<
  HookEnv &
    UuidEnv &
    SharedRefEnv<HookPositions> &
    SharedRefEnv<HookSymbols> &
    SharedRefEnv<HookDisposables>,
  HookEnvironment
> = doEffect(function* () {
  const ref = yield* useRef(createUuid)
  const env = yield* getKeyedEnvironment(ref.current)

  return env
})

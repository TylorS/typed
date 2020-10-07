import { Disposable, lazy, LazyDisposable } from '@typed/fp/Disposable/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { HookEnvironmentId } from '@typed/fp/hooks/core/types/HookEnvironment'
import {
  createSharedRef,
  readSharedRef,
  SharedRef,
  SharedRefEnv,
} from '@typed/fp/SharedRef/exports'

export const HOOK_DISPOSABLES = '@typed/fp/HookDisposables'
export type HOOK_DISPOSABLES = typeof HOOK_DISPOSABLES

export interface HookDisposables
  extends SharedRef<HOOK_DISPOSABLES, Map<HookEnvironmentId, LazyDisposable>> {}

export const HookDisposables = createSharedRef<HookDisposables>(HOOK_DISPOSABLES)

export const getHookDisposables = readSharedRef(HookDisposables)

export const addDisposable = (
  id: HookEnvironmentId,
  disposable: Disposable,
): Effect<SharedRefEnv<HookDisposables>, Disposable> => {
  const eff = doEffect(function* () {
    const map = yield* getHookDisposables
    const { addDisposable } = map.get(id) ?? map.set(id, lazy()).get(id)!

    return addDisposable(disposable)
  })

  return eff
}

export const disposeHookEnvironment = (
  id: HookEnvironmentId,
): Effect<SharedRefEnv<HookDisposables>, void> => {
  const eff = doEffect(function* () {
    const map = yield* getHookDisposables

    map.get(id)?.dispose()
    map.delete(id)
  })

  return eff
}

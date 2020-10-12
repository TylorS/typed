import { WhenIdleEnv } from '@typed/fp/dom/exports'
import { raf, RafEnv } from '@typed/fp/dom/raf'
import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { FiberEnv, fork, proceedAll } from '@typed/fp/fibers/exports'
import { getHookEnv, HookEnv, runWithHooks } from '@typed/fp/hooks/core/exports'

import { Patch, patch } from './Patch'
import { respondToRemoveEvents } from './respondToRemoveEvents'
import { respondToRunningEvents } from './respondToRunningEvents'
import { respondToUpdateEvents } from './respondToUpdateEvents'
import { updatedEnvs } from './sharedRefs/UpdatedEnvs'
import { effectsWorker } from './workers/effectsWorker'
import { renderWorker } from './workers/renderWorker'
import { whenIdleWorker } from './workers/whenIdleWorker'

export function patchOnRaf<E extends HookEnv, A, B>(
  main: Effect<E, A>,
  initial: B,
): Effect<E & PatchOnRafEnv<A, B>, never> {
  let firstRun = true

  const eff = doEffect(function* () {
    const env = yield* getHookEnv
    const renderFiber = yield* fork(whenIdleWorker(renderWorker))
    const effectsFiber = yield* fork(whenIdleWorker(effectsWorker))

    yield* respondToRemoveEvents
    yield* respondToRunningEvents
    yield* respondToUpdateEvents

    let previous = initial

    while (true) {
      if (!firstRun) {
        yield* raf
      }

      if (firstRun || (yield* updatedEnvs.has(env.id))) {
        firstRun = false
        previous = yield* patch(previous, yield* runWithHooks(env, main))
      }

      // Run any queued effects and do any patching that can happen while idle
      yield* proceedAll(effectsFiber, renderFiber)
    }
  })

  return eff
}

export type PatchOnRafEnv<A, B> = FiberEnv &
  RafEnv &
  WhenIdleEnv &
  Patch<B, A> &
  EnvOf<typeof respondToRemoveEvents> &
  EnvOf<typeof respondToRunningEvents> &
  EnvOf<typeof respondToUpdateEvents> &
  EnvOf<ReturnType<typeof runWithHooks>> &
  EnvOf<typeof effectsWorker> &
  EnvOf<typeof renderWorker>

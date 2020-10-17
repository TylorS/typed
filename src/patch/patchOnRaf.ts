import { WhenIdleEnv } from '@typed/fp/dom/exports'
import { raf, RafEnv } from '@typed/fp/dom/raf'
import { ask, doEffect, Effect, EnvOf, execEffect, map, Pure, zip } from '@typed/fp/Effect/exports'
import { FiberEnv, fork, proceed } from '@typed/fp/fibers/exports'
import { createHookEnv, HookEnv, runWithHooks } from '@typed/fp/hooks/core/exports'

import { EnvBrandOf } from './EnvBrand'
import { Patch, patch } from './Patch'
import { respondToRemoveEvents } from './respondToRemoveEvents'
import { respondToRunningEvents } from './respondToRunningEvents'
import { respondToUpdateEvents } from './respondToUpdateEvents'
import { effectQueue } from './sharedRefs/exports'
import { updatedEnvs } from './sharedRefs/UpdatedEnvs'
import { effectsWorker } from './workers/effectsWorker'
import { renderWorker } from './workers/renderWorker'
import { whenIdleWorker } from './workers/whenIdleWorker'

export interface AddEffect {
  (eff: Pure<any>): void
  <E>(eff: Effect<E, any>, env: E): void
}

export function patchOnRaf<E extends HookEnv, A, B>(
  main: (addEffect: AddEffect) => Effect<E, A>,
  initial: B,
): Effect<E & PatchOnRafEnv<B, A> & EnvBrandOf<B>, never> {
  let firstRun = true

  const eff = doEffect(function* () {
    const { hookEnvironment } = yield* createHookEnv
    const workers = map(([x, y]) => x || y, zip([renderWorker(hookEnvironment.id), effectsWorker]))
    const fiber = yield* fork(whenIdleWorker(workers))

    yield* respondToRemoveEvents
    yield* respondToRunningEvents
    yield* respondToUpdateEvents

    const e = yield* ask<EnvOf<typeof effectQueue['enqueue']>>()
    const addEffect: AddEffect = <E, A>(effect: Effect<E, A>, env: E = {} as E) =>
      execEffect(e, effectQueue.enqueue([effect, env]))
    const mainEff = main(addEffect)

    let previous = initial

    function* checkShouldRun() {
      if (firstRun) {
        return true
      }

      return yield* updatedEnvs.has(hookEnvironment.id)
    }

    while (true) {
      if (!firstRun) {
        yield* raf
      }

      if (yield* checkShouldRun()) {
        firstRun = false
        previous = yield* patch(previous, yield* runWithHooks(hookEnvironment, mainEff))
      }

      yield* proceed(fiber)
    }
  })

  return eff
}

export type PatchOnRafEnv<A, B> = FiberEnv &
  RafEnv &
  WhenIdleEnv &
  Patch<A, B> &
  EnvOf<typeof createHookEnv> &
  EnvOf<typeof respondToRemoveEvents> &
  EnvOf<typeof respondToRunningEvents> &
  EnvOf<typeof respondToUpdateEvents> &
  EnvOf<ReturnType<typeof runWithHooks>> &
  EnvOf<typeof effectsWorker> &
  EnvOf<typeof renderWorker>

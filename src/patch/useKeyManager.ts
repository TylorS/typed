import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, EnvOf, Pure } from '@typed/fp/Effect/Effect'
import { ask, doEffect, execEffect } from '@typed/fp/Effect/exports'
import {
  getKeyedEnvironment,
  HookEnv,
  removeKeyedEnvironment,
  runWithHooks,
  useDisposable,
  useMemo,
  useRef,
} from '@typed/fp/hooks/core/exports'
import { Ref } from '@typed/fp/SharedRef/Ref'
import { Eq, getTupleEq } from 'fp-ts/Eq'
import { constNull, pipe } from 'fp-ts/function'

import { renderableEnvs } from './sharedRefs/RenderableEnvs'
import { renderedEnvs } from './sharedRefs/RenderedEnvs'
import { rendererEnvs } from './sharedRefs/RendererEnvs'
import { updatedEnvs } from './sharedRefs/UpdatedEnvs'

const useFirstRun = useRef(Pure.of(true))

/**
 * Tracks all the necessary state that is required to patch an Effect when its
 * associated HookEnvironment is updated.
 */
export function useKeyManager<K, E extends HookEnv, A, B>(
  key: K,
  render: (ref: Ref<A | null | undefined>) => Effect<E, B>,
  eq: Eq<K> = deepEqualsEq,
): Effect<E & KeyManagerEnv, B> {
  const eff = doEffect(function* () {
    const firstRunRef = yield* useFirstRun
    const hookEnvironment = yield* getKeyedEnvironment(key)
    const env = yield* ask<E & KeyManagerEnv>()
    const rendered = yield* useRef<{}, A | null | undefined>(Pure.fromIO(constNull))
    const renderEff = runWithHooks(hookEnvironment, render(rendered))
    const renderable = yield* useRef(renderEff)
    const { id } = hookEnvironment

    yield* useDisposable(
      (k) => ({
        dispose: () => pipe(k, removeKeyedEnvironment, execEffect(env)),
      }),
      [key],
      yield* useMemo(getTupleEq, [eq]),
    )

    if (firstRunRef.current) {
      firstRunRef.current = false

      yield* renderableEnvs.set(id, renderable)
      yield* renderedEnvs.set(id, rendered)
      yield* rendererEnvs.set(id, [render, env])
    } else if (yield* updatedEnvs.has(id)) {
      renderable.current = yield* renderEff
    }

    return renderable.current
  })

  return eff
}

export type KeyManagerEnv = EnvOf<typeof getKeyedEnvironment> &
  EnvOf<typeof useRef> &
  EnvOf<ReturnType<typeof runWithHooks>> &
  EnvOf<typeof updatedEnvs['has']> &
  EnvOf<typeof renderedEnvs['set']> &
  EnvOf<typeof rendererEnvs['set']> &
  EnvOf<typeof removeKeyedEnvironment>

import { doEffect, Effect, provide, zip } from '@typed/fp/Effect/exports'
import { HookEnvironmentId, runWithHooks } from '@typed/fp/hooks/core/exports'
import { Ref } from '@typed/fp/SharedRef/Ref'
import { pipe } from 'fp-ts/function'
import { isNone, Some } from 'fp-ts/Option'

import { patch } from '../Patch'
import { renderedEnvs } from '../sharedRefs/RenderedEnvs'
import { rendererEnvs } from '../sharedRefs/RendererEnvs'
import { renderQueue } from '../sharedRefs/RenderQueue'
import { updatedEnvs } from '../sharedRefs/UpdatedEnvs'
import { updatingEnvs } from '../sharedRefs/UpdatingEnvs'

export const renderWorker = (rootId: HookEnvironmentId) =>
  doEffect(function* () {
    const option = yield* renderQueue.dequeue

    if (isNone(option)) {
      return false
    }

    const hookEnv = option.value
    const { id } = hookEnv

    if (id === rootId) {
      return true
    }

    const [rendered, renderer, updated] = yield* zip([
      renderedEnvs.get(id),
      rendererEnvs.get(id),
      updatedEnvs.has(id),
    ] as const)

    const notReadyForPatching =
      !updated || isNone(rendered) || !rendered.value.current || isNone(renderer)
    const isCurrentlyUpdating = yield* updatingEnvs.has(id)
    const shouldRequeue = isCurrentlyUpdating && !(yield* renderQueue.some((e) => e.id == id))

    if (shouldRequeue) {
      yield* renderQueue.enqueue(hookEnv)
    }

    if (notReadyForPatching || shouldRequeue) {
      return true
    }

    yield* updatingEnvs.add(id)

    const renderedRef = (rendered as Some<Ref<any>>).value
    const [render, env] = (renderer as Some<
      readonly [effect: (ref: Ref<any>) => Effect<any, any>, env: any]
    >).value

    const b = yield* pipe(runWithHooks(hookEnv, render(renderedRef)), provide(env))
    const a = yield* patch(renderedRef.current, b)

    renderedRef.current = a

    yield* updatingEnvs.delete(id)

    return true
  })

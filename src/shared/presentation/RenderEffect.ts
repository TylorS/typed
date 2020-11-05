import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'

import { createRef, Ref } from '../application/exports'
import { getShared, shared, SharedEnv } from '../domain/exports'

export const RenderEffect = shared(
  Symbol('RenderEffect'),
  Pure.fromIO(() => createRef()),
)

export const getRenderEffect = <E, A>(): Effect<
  SharedEnv,
  Ref<readonly [Effect<E, A>, E] | undefined>
> =>
  doEffect(function* () {
    const ref = yield* getShared(RenderEffect)

    return ref as Ref<readonly [Effect<E, A>, E] | undefined>
  })

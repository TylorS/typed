import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'

import { createRef, Ref } from '../application/exports'
import { getShared, shared, SharedEnv } from '../domain/exports'

export const RenderRef = shared(
  Symbol('RenderRef'),
  Pure.fromIO(() => createRef()),
)

export const getRenderRef = <A>(): Effect<SharedEnv, Ref<A | null | undefined>> =>
  doEffect(function* () {
    const ref = yield* getShared(RenderRef)

    return ref as Ref<A | null | undefined>
  })

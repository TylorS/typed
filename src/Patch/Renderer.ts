import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, SharedEnv } from '@typed/fp/Shared/core/exports'
import { createRef, Ref } from '@typed/fp/Shared/Ref/exports'

export const Renderer = createShared(
  Symbol('Renderer'),
  Pure.fromIO(() => createRef<any>()),
)

export const getRenderer = <A>(): Effect<
  SharedEnv,
  Ref<readonly [effect: Effect<any, A>, env: any]>
> => getShared(Renderer)

export const setRenderer = <E, A>(effect: Effect<E, A>, env: E) => {
  const eff = doEffect(function* () {
    const ref = yield* getRenderer<A>()

    ref.current = [effect, env]
  })

  return eff
}

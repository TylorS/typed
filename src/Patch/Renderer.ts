import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, SharedEnv } from '@typed/fp/Shared/core/exports'
import { createRef, Ref } from '@typed/fp/Shared/Ref/exports'

/**
 * A Shared value for the Effect being used to Render a given Namespace.
 */
export const Renderer = createShared(
  Symbol.for('Renderer'),
  Pure.fromIO(() => createRef<any>()),
)

/**
 * Get the Renderer for the current Namespace
 */
export const getRenderer = <A>(): Effect<
  SharedEnv,
  Ref<readonly [effect: Effect<any, A>, env: any]>
> => getShared(Renderer)

/**
 * Set the renderer for the current Namespace
 */
export const setRenderer = <E, A>(effect: Effect<E, A>, env: E) => {
  const eff = doEffect(function* () {
    const ref = yield* getRenderer<A>()

    ref.current = [effect, env]
  })

  return eff
}

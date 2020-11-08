import { doEffect, useAll, useSome } from '@typed/fp/Effect/exports'
import { isNull, isUndefined } from '@typed/fp/logic/is'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/lib/Option'

import { getNamespaceParent } from '../../context/exports'
import { hasShared, Namespace, runWithNamespace, usingNamespace } from '../../core/exports'
import { Patch, patch } from '../Patch'
import { getRenderer, Renderer } from '../Renderer'
import { getRenderRef } from '../RenderRef'

export function createPatchNamespace<A, B>(Patch: Patch<A, B>) {
  return (namespace: Namespace) => {
    const eff = doEffect(function* () {
      if (!(yield* hasShared(Renderer))) {
        return
      }

      const parent = yield* getNamespaceParent

      // Only patch non-root nodes
      if (isNone(parent)) {
        return
      }

      const { current } = yield* getRenderer()
      const [effect, env] = current

      const a = yield* getRenderRef<A>()

      // Can only patch if we know the previous value
      if (isNull(a.current) || isUndefined(a.current)) {
        return
      }

      const b = (yield* pipe(
        runWithNamespace(namespace, effect),
        usingNamespace(parent.value),
        useAll(env),
      )) as B

      a.current = yield* pipe(patch(a.current, b), useSome(Patch))
    })

    return pipe(eff, usingNamespace(namespace))
  }
}

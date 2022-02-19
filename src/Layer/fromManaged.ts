import * as Fx from '@/Fx'
import { Managed } from '@/Managed'
import { pipe } from '@/Prelude/function'

import * as Layer from './Layer'

export function fromManaged<R, E, A>(
  managed: Managed<R, E, A>,
  options: Layer.LayerOptions,
): Layer.Layer<R, E, A> {
  return Layer.make(
    Fx.Fx(function* () {
      const scope = yield* Fx.getScope('fromManaged')
      const requirements = yield* Fx.ask<R>()
      const { releaseMap } = scope

      const [, a] = yield* pipe(managed.fx, Fx.provideAll({ requirements, releaseMap }))

      return a
    }),
    options,
  )
}

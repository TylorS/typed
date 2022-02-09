import * as Fx from '@/Fx'
import { from, Has, has } from '@/Has'
import * as Layer from '@/Layer'
import { flow, pipe } from '@/Prelude/function'
import { Option } from '@/Prelude/Option'

import { Service } from './Service'

/**
 * Update a Layer for a Service.
 */
export function update<Name extends string, S, R2, E2>(
  service: Service<Name, S>,
  f: (service: S) => Fx.Fx<R2, E2, S>,
) {
  return <R, E>(
    layer: Layer.Layer<R, E, Has<Name, S>>,
  ): Fx.Fx<R & R2, E | E2, Option<Has<Name, S>>> =>
    pipe(
      layer,
      Layer.update(
        flow(
          from(service),
          f,
          Fx.map((i) => has(service, i)),
        ),
      ),
    )
}

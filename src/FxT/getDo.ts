import { doFx, Fx } from '@fp/Fx'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { LiftFx, liftFx } from './liftFx'

export function getDo<F>() {
  const lift = liftFx<F>()

  return <Y extends KindOf<F>, R, N = unknown>(
    f: (lift: LiftFx<F>) => Generator<Y, R, N>,
  ): Fx<Y, R, N> => doFx(() => f(lift))
}

export type KindOf<F> = F extends URIS
  ? Kind<F, any>
  : F extends URIS2
  ? Kind2<F, any, any>
  : F extends URIS3
  ? Kind3<F, any, any, any>
  : F extends URIS4
  ? Kind4<F, any, any, any, any>
  : HKT<F, any>

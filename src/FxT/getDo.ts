import { doFx, Fx } from '@typed/fp/Fx'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { liftFx, LiftFx1, LiftFx2, LiftFx3, LiftFx4, LiftFxHKT } from './liftFx'

export function getDo<F extends URIS>(): <Y extends Kind<F, any>, R, N = unknown>(
  f: (lift: LiftFx1<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>

export function getDo<F extends URIS2, E = any>(): <Y extends Kind2<F, E, any>, R, N = unknown>(
  f: (lift: LiftFx2<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>

export function getDo<F extends URIS3, R = any, E = any>(): <
  Y extends Kind3<F, R, E, any>,
  Z,
  N = unknown
>(
  f: (lift: LiftFx3<F>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>

export function getDo<F extends URIS4, S = any, R = any, E = any>(): <
  Y extends Kind4<F, S, R, E, any>,
  Z,
  N = unknown
>(
  f: (lift: LiftFx4<F>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>

export function getDo<F>(): <Y extends HKT<F, any>, R, N = unknown>(
  f: (lift: LiftFxHKT<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>

export function getDo<F>() {
  const lift = liftFx<F>()

  return <Y extends KindOf<F>, R, N = unknown>(
    f: (lift: LiftFxHKT<F>) => Generator<Y, R, N>,
  ): Fx<Y, R, N> => doFx(() => f(lift as LiftFxHKT<F>))
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

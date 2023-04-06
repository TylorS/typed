import type { Kind, TypeLambda } from '@effect/data/HKT'
import * as C from '@effect/data/typeclass/Covariant'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { map } from '@typed/fx/internal/operator/map'

export const imap = C.imap<FxTypeLambda>(map)

export const Covariant: C.Covariant<FxTypeLambda> = {
  map,
  imap,
}

export const as = C.as(Covariant)
export const asUnit = C.asUnit(Covariant)
export const flap = C.flap(Covariant)

const let_ = C.let(Covariant)

export { let_ as let }

export const mapComposition: <T extends TypeLambda>(
  other: C.Covariant<T>,
) => <R, E, GR, GO, GE, A, B>(
  self: Fx<R, E, Kind<T, GR, GO, GE, A>>,
  f: (a: A) => B,
) => Fx<R, E, Kind<T, GR, GO, GE, B>> = <T extends TypeLambda>(other: C.Covariant<T>) =>
  C.mapComposition(Covariant, other)

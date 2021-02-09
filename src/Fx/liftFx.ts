import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Fx } from './Fx'

export type LiftFx<F> = F extends URIS
  ? <A>(kind: Kind<F, A>) => Fx<Kind<F, A>, A>
  : F extends URIS2
  ? <E, A>(kind: Kind2<F, E, A>) => Fx<Kind2<F, E, A>, A>
  : F extends URIS3
  ? <R, E, A>(kind: Kind3<F, R, E, A>) => Fx<Kind3<F, R, E, A>, A>
  : F extends URIS4
  ? <S, R, E, A>(kind: Kind4<F, S, R, E, A>) => Fx<Kind4<F, S, R, E, A>, A>
  : <F, A>(kind: HKT<F, A>) => Fx<HKT<F, A>, A>

export const liftFx = <F>() => lift_ as LiftFx<F>

function lift_<F, A>(hkt: HKT<F, A>): Fx<typeof hkt, A> {
  return {
    [Symbol.iterator]: function* () {
      const value = yield hkt

      return value as A
    },
  }
}

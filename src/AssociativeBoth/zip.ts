import { Hkt, Kind, Uris1, Uris2, Uris3, VarianceOf } from '@/Hkt'
import { Tuple } from '@/Tuple'

import {
  AssociativeBoth1,
  AssociativeBoth2,
  AssociativeBoth3,
  AssociativeBothHkt,
} from './AssociativeBoth'

export function zip<Uri extends Uris3>(
  AB: AssociativeBoth3<Uri>,
): {
  '+': {
    '+': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 | R2, E1 | E2, Tuple<A, B>]>
    '-': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 | R2, E1 & E2, Tuple<A, B>]>
    _: <R1, E, B>(
      right: Kind<Uri, [R1, E, B]>,
    ) => <R2, A>(left: Kind<Uri, [R2, E, A]>) => Kind<Uri, [R1 | R2, E, Tuple<A, B>]>
  }[VarianceOf<Uri, 'E'>]
  '-': {
    '+': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 & R2, E1 | E2, Tuple<A, B>]>
    '-': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 & R2, E1 & E2, Tuple<A, B>]>
    _: <R1, E, B>(
      right: Kind<Uri, [R1, E, B]>,
    ) => <R2, A>(left: Kind<Uri, [R2, E, A]>) => Kind<Uri, [R1 & R2, E, Tuple<A, B>]>
  }
  _: {
    '+': <R, E1, B>(
      right: Kind<Uri, [R, E1, B]>,
    ) => <E2, A>(left: Kind<Uri, [R, E2, A]>) => Kind<Uri, [R, E1 | E2, Tuple<A, B>]>
    '-': <R, E1, B>(
      right: Kind<Uri, [R, E1, B]>,
    ) => <E2, A>(left: Kind<Uri, [R, E2, A]>) => Kind<Uri, [R, E1 & E2, Tuple<A, B>]>
    _: <R, E, B>(
      right: Kind<Uri, [R, E, B]>,
    ) => <A>(left: Kind<Uri, [R, E, A]>) => Kind<Uri, [R, E, Tuple<A, B>]>
  }[VarianceOf<Uri, 'E'>]
}[VarianceOf<Uri, 'R'>]

export function zip<Uri extends Uris2>(
  AB: AssociativeBoth2<Uri>,
): {
  '+': <E1, B>(
    right: Kind<Uri, [E1, B]>,
  ) => <E2, A>(left: Kind<Uri, [E2, A]>) => Kind<Uri, [E1 | E2, Tuple<A, B>]>
  '-': <E1, B>(
    right: Kind<Uri, [E1, B]>,
  ) => <E2, A>(left: Kind<Uri, [E2, A]>) => Kind<Uri, [E1 & E2, Tuple<A, B>]>
  _: <E, B>(right: Kind<Uri, [E, B]>) => <A>(left: Kind<Uri, [E, A]>) => Kind<Uri, [E, Tuple<A, B>]>
}[VarianceOf<Uri, 'E'>]

export function zip<Uri extends Uris1>(
  AB: AssociativeBoth1<Uri>,
): <B>(right: Kind<Uri, [B]>) => <A>(left: Kind<Uri, [A]>) => Kind<Uri, [Tuple<A, B>]>

export function zip<Uri>(
  AB: AssociativeBothHkt<Uri>,
): <B>(right: Hkt<Uri, B>) => <A>(left: Hkt<Uri, A>) => Hkt<Uri, [Tuple<A, B>]>

export function zip<Uri>(AB: AssociativeBothHkt<Uri>) {
  return <B>(right: Hkt<Uri, B>) =>
    <A>(left: Hkt<Uri, A>): Hkt<Uri, [Tuple<A, B>]> =>
      AB.both(left, right)
}

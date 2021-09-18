import { Either } from '@/Either'
import { Hkt, Kind, Uris1, Uris2, Uris3, VarianceOf } from '@/Hkt'

import {
  AssociativeEither1,
  AssociativeEither2,
  AssociativeEither3,
  AssociativeEitherHkt,
} from './AssociativeEither'

export function race<Uri extends Uris3>(
  AB: AssociativeEither3<Uri>,
): {
  '+': {
    '+': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 | R2, E1 | E2, Either<A, B>]>
    '-': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 | R2, E1 & E2, Either<A, B>]>
    _: <R1, E, B>(
      right: Kind<Uri, [R1, E, B]>,
    ) => <R2, A>(left: Kind<Uri, [R2, E, A]>) => Kind<Uri, [R1 | R2, E, Either<A, B>]>
  }[VarianceOf<Uri, 'E'>]
  '-': {
    '+': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 & R2, E1 | E2, Either<A, B>]>
    '-': <R1, E1, B>(
      right: Kind<Uri, [R1, E1, B]>,
    ) => <R2, E2, A>(left: Kind<Uri, [R2, E2, A]>) => Kind<Uri, [R1 & R2, E1 & E2, Either<A, B>]>
    _: <R1, E, B>(
      right: Kind<Uri, [R1, E, B]>,
    ) => <R2, A>(left: Kind<Uri, [R2, E, A]>) => Kind<Uri, [R1 & R2, E, Either<A, B>]>
  }
  _: {
    '+': <R, E1, B>(
      right: Kind<Uri, [R, E1, B]>,
    ) => <E2, A>(left: Kind<Uri, [R, E2, A]>) => Kind<Uri, [R, E1 | E2, Either<A, B>]>
    '-': <R, E1, B>(
      right: Kind<Uri, [R, E1, B]>,
    ) => <E2, A>(left: Kind<Uri, [R, E2, A]>) => Kind<Uri, [R, E1 & E2, Either<A, B>]>
    _: <R, E, B>(
      right: Kind<Uri, [R, E, B]>,
    ) => <A>(left: Kind<Uri, [R, E, A]>) => Kind<Uri, [R, E, Either<A, B>]>
  }[VarianceOf<Uri, 'E'>]
}[VarianceOf<Uri, 'R'>]

export function race<Uri extends Uris2>(
  AB: AssociativeEither2<Uri>,
): {
  '+': <E1, B>(
    right: Kind<Uri, [E1, B]>,
  ) => <E2, A>(left: Kind<Uri, [E2, A]>) => Kind<Uri, [E1 | E2, Either<A, B>]>
  '-': <E1, B>(
    right: Kind<Uri, [E1, B]>,
  ) => <E2, A>(left: Kind<Uri, [E2, A]>) => Kind<Uri, [E1 & E2, Either<A, B>]>
  _: <E, B>(
    right: Kind<Uri, [E, B]>,
  ) => <A>(left: Kind<Uri, [E, A]>) => Kind<Uri, [E, Either<A, B>]>
}[VarianceOf<Uri, 'E'>]

export function race<Uri extends Uris1>(
  AB: AssociativeEither1<Uri>,
): <B>(right: Kind<Uri, [B]>) => <A>(left: Kind<Uri, [A]>) => Kind<Uri, [Either<A, B>]>

export function race<Uri>(
  AB: AssociativeEitherHkt<Uri>,
): <B>(right: Hkt<Uri, B>) => <A>(left: Hkt<Uri, A>) => Hkt<Uri, [Either<A, B>]>

export function race<Uri>(AB: AssociativeEitherHkt<Uri>) {
  return <B>(right: Hkt<Uri, B>) =>
    <A>(left: Hkt<Uri, A>): Hkt<Uri, [Either<A, B>]> =>
      AB.either(left, right)
}

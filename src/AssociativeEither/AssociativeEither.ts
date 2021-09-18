import { Cast } from 'ts-toolbelt/out/Any/Cast'

import { Either } from '@/Either'
import { Hkt, Kind, Uris, Uris1, Uris2, Uris3, UriToLength } from '@/Hkt'

export interface AssociativeEitherHkt<Uri> {
  readonly either: <A, B>(left: Hkt<Uri, A>, right: Hkt<Uri, B>) => Hkt<Uri, [Either<A, B>]>
}

export type AssociativeEither<Uri extends Uris> = {
  1: AssociativeEither1<Cast<Uri, Uris1>>
  2: AssociativeEither2<Cast<Uri, Uris2>>
  3: AssociativeEither3<Cast<Uri, Uris3>>
}[UriToLength<Uri>]

export interface AssociativeEither1<Uri extends Uris1> {
  readonly either: <A, B>(a: Kind<Uri, [A]>, b: Kind<Uri, [B]>) => Kind<Uri, [Either<A, B>]>
}

export interface AssociativeEither2<Uri extends Uris2> {
  readonly either: <E, A, B>(
    a: Kind<Uri, [E, A]>,
    b: Kind<Uri, [E, B]>,
  ) => Kind<Uri, [E, Either<A, B>]>
}

export interface AssociativeEither3<Uri extends Uris3> {
  readonly either: <R, E, A, B>(
    a: Kind<Uri, [R, E, A]>,
    b: Kind<Uri, [R, E, B]>,
  ) => Kind<Uri, [R, E, Either<A, B>]>
}

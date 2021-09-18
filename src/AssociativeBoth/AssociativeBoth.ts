import { Cast } from 'ts-toolbelt/out/Any/Cast'

import { Hkt, Kind, Uris, Uris1, Uris2, Uris3, UriToLength } from '@/Hkt'
import { Tuple } from '@/Tuple'

export interface AssociativeBothHkt<Uri> {
  readonly both: <A, B>(left: Hkt<Uri, A>, right: Hkt<Uri, B>) => Hkt<Uri, [Tuple<A, B>]>
}

export type AssociativeBoth<Uri extends Uris> = {
  1: AssociativeBoth1<Cast<Uri, Uris1>>
  2: AssociativeBoth2<Cast<Uri, Uris2>>
  3: AssociativeBoth3<Cast<Uri, Uris3>>
}[UriToLength<Uri>]

export interface AssociativeBoth1<Uri extends Uris1> {
  readonly both: <A, B>(a: Kind<Uri, [A]>, b: Kind<Uri, [B]>) => Kind<Uri, [Tuple<A, B>]>
}

export interface AssociativeBoth2<Uri extends Uris2> {
  readonly both: <E, A, B>(
    a: Kind<Uri, [E, A]>,
    b: Kind<Uri, [E, B]>,
  ) => Kind<Uri, [E, Tuple<A, B>]>
}

export interface AssociativeBoth3<Uri extends Uris3> {
  readonly both: <R, E, A, B>(
    a: Kind<Uri, [R, E, A]>,
    b: Kind<Uri, [R, E, B]>,
  ) => Kind<Uri, [R, E, Tuple<A, B>]>
}

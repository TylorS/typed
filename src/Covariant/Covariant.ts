import { Cast } from 'ts-toolbelt/out/Any/Cast'

import { Hkt, Kind, Uris, Uris1, Uris2, Uris3, UriToLength } from '@/Hkt'

export interface CovariantHkt<U> {
  readonly map: <A, B>(hkt: Hkt<U, A>, f: (a: A) => B) => Hkt<U, B>
}

export type Covariant<U extends Uris> = {
  1: Covariant1<Cast<U, Uris1>>
  2: Covariant2<Cast<U, Uris2>>
  3: Covariant3<Cast<U, Uris3>>
}[UriToLength<U>]

export interface Covariant1<U extends Uris1> {
  readonly map: <A, B>(hkt: Kind<U, [A]>, f: (a: A) => B) => Kind<U, [B]>
}

export interface Covariant2<U extends Uris2> {
  readonly map: <E, A, B>(hkt: Kind<U, [E, A]>, f: (a: A) => B) => Kind<U, [E, B]>
}

export interface Covariant3<U extends Uris3> {
  readonly map: <R, E, A, B>(hkt: Kind<U, [R, E, A]>, f: (a: A) => B) => Kind<U, [R, E, B]>
}

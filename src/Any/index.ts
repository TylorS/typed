import { Cast } from 'ts-toolbelt/out/Any/Cast'

import { Hkt, InitialOf, Kind, Uris, Uris1, Uris2, Uris3, UriToLength } from '@/Hkt'

export interface AnyHkt<Uri> {
  readonly any: Hkt<Uri, readonly any[]>
}

export interface Any1<Uri extends Uris1> {
  readonly any: Kind<Uri, [InitialOf<Uri, 'A'>]>
}

export interface Any2<Uri extends Uris2> {
  readonly any: Kind<Uri, [InitialOf<Uri, 'E'>, InitialOf<Uri, 'A'>]>
}

export interface Any3<Uri extends Uris3> {
  readonly any: Kind<Uri, [InitialOf<Uri, 'R'>, InitialOf<Uri, 'E'>, InitialOf<Uri, 'A'>]>
}

export type Any<U extends Uris> = {
  1: Any1<Cast<U, Uris1>>
  2: Any2<Cast<U, Uris2>>
  3: Any3<Cast<U, Uris3>>
}[UriToLength<U>]

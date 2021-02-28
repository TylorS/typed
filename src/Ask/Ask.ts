import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

export interface Ask<F> {
  readonly URI?: F
  readonly ask: <A>() => HKT<F, A>
}

export interface Ask1<F extends URIS> {
  readonly URI?: F
  readonly ask: <A>() => Kind<F, A>
}

export interface Ask2<F extends URIS2> {
  readonly URI?: F
  readonly ask: <A>() => Kind2<F, A, A>
}

export interface Ask3<F extends URIS3> {
  readonly URI?: F
  readonly ask: <R, A>() => Kind3<F, R, A, A>
}

export interface Ask3C<F extends URIS3, E> {
  readonly URI?: F
  readonly ask: <A>() => Kind3<F, A, E, A>
}

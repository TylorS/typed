import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

export interface Ask<F, A> {
  readonly URI?: F
  readonly ask: () => HKT<F, A>
}

export interface Ask1<F extends URIS, A> {
  readonly URI?: F
  readonly ask: () => Kind<F, A>
}

export interface Ask2<F extends URIS2, A> {
  readonly URI?: F
  readonly ask: () => Kind2<F, A, A>
}

export interface Ask3<F extends URIS3, A> {
  readonly URI?: F
  readonly ask: <R>() => Kind3<F, R, A, A>
}

export interface Ask3C<F extends URIS3, A> {
  readonly URI?: F
  readonly ask: <E>() => Kind3<F, A, E, A>
}

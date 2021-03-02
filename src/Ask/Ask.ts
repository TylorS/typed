import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export interface Ask<F> {
  readonly URI?: F
  readonly ask: <A>() => HKT<F, A>
}

export interface Ask2<F extends URIS2> {
  readonly URI?: F
  readonly ask: <A>() => Kind2<F, A, A>
}

export interface Ask2C<F extends URIS2, A> {
  readonly URI?: F
  readonly ask: () => Kind2<F, A, A>
}

export interface Ask3<F extends URIS3> {
  readonly URI?: F
  readonly ask: <E, A>() => Kind3<F, A, E, A>
}

export interface Ask3C<F extends URIS3, E> {
  readonly URI?: F
  readonly ask: <A>() => Kind3<F, A, E, A>
}

export interface Ask4<F extends URIS4> {
  readonly URI?: F
  readonly ask: <R, E, A>() => Kind4<F, R, A, E, A>
}

export interface Ask4C<F extends URIS4, E> {
  readonly URI?: F
  readonly ask: <S, A>() => Kind4<F, S, A, E, A>
}

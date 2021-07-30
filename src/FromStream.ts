import { Chain, Chain1, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'
import { HKT, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import {
  NaturalTransformation11,
  NaturalTransformation12,
  NaturalTransformation12C,
  NaturalTransformation13,
  NaturalTransformation13C,
  NaturalTransformation14,
  NaturalTransformation14C,
} from 'fp-ts/NaturalTransformation'

import { Hkt } from './HKT'
import * as S from './Stream'

export type FromStream<F> = {
  readonly URI?: F
  readonly fromStream: <A>(Stream: S.Stream<A>) => HKT<F, A>
}

export type FromStream1<F extends URIS> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation11<S.URI, F>
}

export type FromStream2<F extends URIS2> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation12<S.URI, F>
}

export type FromStream2C<F extends URIS2, E> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation12C<S.URI, F, E>
}

export type FromStream3<F extends URIS3> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation13<S.URI, F>
}

export type FromStream3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation13C<S.URI, F, E>
}

export type FromStream4<F extends URIS4> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation14<S.URI, F>
}

export type FromStream4C<F extends URIS4, E> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation14C<S.URI, F, E>
}

export function fromStreamK<F extends URIS>(
  F: FromStream1<F>,
): <A extends readonly any[], B>(f: (...args: A) => S.Stream<B>) => (...args: A) => Hkt<F, [B]>

export function fromStreamK<F extends URIS2>(
  F: FromStream2<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => S.Stream<B>,
) => <E>(...args: A) => Hkt<F, [E, B]>

export function fromStreamK<F extends URIS3>(
  F: FromStream3<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => S.Stream<B>,
) => <R, E>(...args: A) => Hkt<F, [R, E, B]>

export function fromStreamK<F extends URIS4>(
  F: FromStream4<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => S.Stream<B>,
) => <S, R, E>(...args: A) => Hkt<F, [S, R, E, B]>

export function fromStreamK<F>(
  F: FromStream<F>,
): <A extends readonly any[], B>(f: (...args: A) => S.Stream<B>) => (...args: A) => Hkt<F, [B]>

export function fromStreamK<F>(F: FromStream<F>) {
  return <A extends readonly any[], B>(f: (...args: A) => S.Stream<B>) =>
    (...args: A): HKT<F, B> =>
      F.fromStream(f(...args))
}

export function chainStreamK<F extends URIS>(
  F: FromStream1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>

export function chainStreamK<F extends URIS2>(
  F: FromStream2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, B]>

export function chainStreamK<F extends URIS3>(
  F: FromStream3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, B]>

export function chainStreamK<F extends URIS4>(
  F: FromStream4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => S.Stream<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, B]>

export function chainStreamK<F>(
  F: FromStream<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>

export function chainStreamK<F>(
  F: FromStream<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: HKT<F, A>) => HKT<F, B> {
  return (f) => C.chain(flow(f, F.fromStream))
}

export function chainFirstStreamK<F extends URIS>(
  F: FromStream1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>

export function chainFirstStreamK<F extends URIS2>(
  F: FromStream2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, A]>

export function chainFirstStreamK<F extends URIS3>(
  F: FromStream3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, A]>

export function chainFirstStreamK<F extends URIS4>(
  F: FromStream4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => S.Stream<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, A]>

export function chainFirstStreamK<F>(
  F: FromStream<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>

export function chainFirstStreamK<F>(
  F: FromStream<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: HKT<F, A>) => HKT<F, A> {
  const chainF = chainFirst(C)

  return (f) => chainF(flow(f, F.fromStream))
}

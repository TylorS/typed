/**
 * FromReaderStream is a Typeclass which represents the Natural Transformation from an ReaderStream into another
 * effect.
 * @since 0.13.9
 */
import { Chain, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'
import { HKT, HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import {
  NaturalTransformation22,
  NaturalTransformation23R,
  NaturalTransformation23RC,
  NaturalTransformation24R,
} from 'fp-ts/NaturalTransformation'

import { ApplyVariance, Hkt, Initial } from './HKT'
import * as Provide from './Provide'
import * as RS from './ReaderStream'

/**
 * @since 0.13.9
 * @category Typeclass
 */
export type FromReaderStream<F> = {
  readonly URI?: F
  readonly fromReaderStream: <E, A>(stream: RS.ReaderStream<E, A>) => HKT2<F, E, A>
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export type FromReaderStream2<F extends URIS2> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation22<RS.URI, F>
}

/**
 * @since 0.13.9
 * @category Typeclass
 */
export type FromReaderStream3<F extends URIS3> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation23R<RS.URI, F>
}

/**
 * @since 0.13.9
 * @category Typeclass
 */
export type FromReaderStream3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation23RC<RS.URI, F, E>
}

/**
 * @since 0.13.9
 * @category Typeclass
 */
export type FromReaderStream4<F extends URIS4> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation24R<RS.URI, F>
}

/**
 * @since 0.13.9
 * @category Constructor
 */
export function fromReaderStreamK<F extends URIS2>(
  F: FromReaderStream2<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => RS.ReaderStream<R, B>,
) => (...args: A) => Hkt<F, [R, B]>

export function fromReaderStreamK<F extends URIS3>(
  F: FromReaderStream3<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => RS.ReaderStream<R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>

export function fromReaderStreamK<F extends URIS4>(
  F: FromReaderStream4<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => RS.ReaderStream<R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>

export function fromReaderStreamK<F>(
  F: FromReaderStream<F>,
): <A extends readonly any[], E, B>(
  f: (...args: A) => RS.ReaderStream<E, B>,
) => (...args: A) => Hkt<F, [E, B]>

export function fromReaderStreamK<F>(F: FromReaderStream<F>) {
  return <A extends readonly any[], E, B>(f: (...args: A) => RS.ReaderStream<E, B>) =>
    (...args: A) =>
      F.fromReaderStream(f(...args))
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export function chainReaderStreamK<F extends URIS2>(
  F: FromReaderStream2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainReaderStreamK<F extends URIS3>(
  F: FromReaderStream3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainReaderStreamK<F extends URIS4>(
  F: FromReaderStream4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainReaderStreamK<F>(
  F: FromReaderStream<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainReaderStreamK<F>(
  F: FromReaderStream<F>,
  C: Chain<F>,
): <A, R, B>(f: (value: A) => RS.ReaderStream<R, B>) => (hkt: HKT<F, A>) => HKT<F, B> {
  return (f) => C.chain(flow(f, F.fromReaderStream) as any)
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export function chainFirstReaderStreamK<F extends URIS2>(
  F: FromReaderStream2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstReaderStreamK<F extends URIS3>(
  F: FromReaderStream3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstReaderStreamK<F extends URIS4>(
  F: FromReaderStream4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstReaderStreamK<F>(
  F: FromReaderStream<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstReaderStreamK<F>(
  F: FromReaderStream<F>,
  C: Chain<F>,
): <A, E, B>(f: (value: A) => RS.ReaderStream<E, B>) => (hkt: HKT<F, A>) => HKT<F, A> {
  const chainF = chainFirst(C)

  return (f) => chainF(flow(f, F.fromReaderStream) as any)
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export function provideSomeWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.ProvideSome4<F> & Chain4<F>,
): <E, A>(
  stream: RS.ReaderStream<E, A>,
) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export function provideSomeWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.ProvideSome3<F> & Chain3<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export function provideSomeWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.ProvideSome2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider2<F, A, E>
export function provideSomeWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.ProvideSome<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider<F, A, E>
export function provideSomeWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.ProvideSome<F> & Chain<F>,
) {
  return flow(F.fromReaderStream, Provide.provideSomeWith(F))
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export function provideAllWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.ProvideAll4<F> & Chain4<F>,
): <R, A>(
  stream: RS.ReaderStream<R, A>,
) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export function provideAllWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.ProvideAll3<F> & Chain3<F>,
): <R, A>(stream: RS.ReaderStream<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export function provideAllWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.ProvideAll2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export function provideAllWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.ProvideAll<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
export function provideAllWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.ProvideAll<F> & Chain<F>,
) {
  return flow(F.fromReaderStream, Provide.provideAllWith(F))
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export function useSomeWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.UseSome4<F> & Chain4<F>,
): <E, A>(
  stream: RS.ReaderStream<E, A>,
) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export function useSomeWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.UseSome3<F> & Chain3<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export function useSomeWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.UseSome2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider2<F, A, E>
export function useSomeWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.UseSome<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider<F, A, E>
export function useSomeWithReaderStream<F>(F: FromReaderStream<F> & Provide.UseSome<F> & Chain<F>) {
  return flow(F.fromReaderStream, Provide.useSomeWith(F))
}

/**
 * @since 0.13.9
 * @category Combinator
 */
export function useAllWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.UseAll4<F> & Chain4<F>,
): <R, A>(
  stream: RS.ReaderStream<R, A>,
) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export function useAllWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.UseAll3<F> & Chain3<F>,
): <R, A>(stream: RS.ReaderStream<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export function useAllWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.UseAll2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export function useAllWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.UseAll<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
export function useAllWithReaderStream<F>(F: FromReaderStream<F> & Provide.UseAll<F> & Chain<F>) {
  return flow(F.fromReaderStream, Provide.useAllWith(F))
}

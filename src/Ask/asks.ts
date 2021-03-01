import { pipe } from 'fp-ts/dist/function'
import { Functor, Functor2C, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Ask, Ask2, Ask3, Ask3C, Ask4, Ask4C } from './Ask'

export function asks<F extends URIS2, A>(
  M: Ask2<F> & Functor2C<F, A>,
): <B>(f: (asked: A) => B) => Kind2<F, A, B>

export function asks<F extends URIS3>(
  M: Ask3<F> & Functor3<F>,
): <R, A, B>(f: (asked: A) => B) => Kind3<F, R, A, B>

export function asks<F extends URIS3, E>(
  M: Ask3C<F, E> & Functor3C<F, E>,
): <A, B>(f: (asked: A) => B) => Kind3<F, A, E, B>

export function asks<F extends URIS4>(
  M: Ask4<F> & Functor4<F>,
): <S, E, A, B>(f: (asked: A) => B) => Kind4<F, S, A, E, B>

export function asks<F extends URIS4, E>(
  M: Ask4C<F, E> & Functor4<F>,
): <S, A, B>(f: (asked: A) => B) => Kind4<F, S, A, E, B>

export function asks<F>(M: Ask<F> & Functor<F>): <A, B>(f: (asked: A) => B) => HKT<F, B>

export function asks<F>(M: Ask<F> & Functor<F>) {
  return <A, B>(f: (asked: A) => B): HKT<F, B> => pipe(M.ask<A>(), M.map(f))
}

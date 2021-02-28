import { pipe } from 'fp-ts/dist/function'
import { Functor, Functor1, Functor2C, Functor3 } from 'fp-ts/dist/Functor'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { Ask, Ask1, Ask2, Ask3, Ask3C } from './Ask'

export function asks<F extends URIS>(
  M: Ask1<F> & Functor1<F>,
): <A, B>(f: (asked: A) => B) => Kind<F, B>

export function asks<F extends URIS2, A>(
  M: Ask2<F> & Functor2C<F, A>,
): <B>(f: (asked: A) => B) => Kind2<F, A, B>

export function asks<F extends URIS3>(
  M: Ask3<F> & Functor3<F>,
): <R, A, B>(f: (asked: A) => B) => Kind3<F, R, A, B>

export function asks<F extends URIS3, A>(
  M: Ask3C<F, A> & Functor3<F>,
): <E, B>(f: (asked: A) => B) => Kind3<F, A, E, B>

export function asks<F>(M: Ask<F> & Functor<F>): <A, B>(f: (asked: A) => B) => HKT<F, B>

export function asks<F>(M: Ask<F> & Functor<F>) {
  return <A, B>(f: (asked: A) => B): HKT<F, B> => pipe(M.ask<A>(), M.map(f))
}

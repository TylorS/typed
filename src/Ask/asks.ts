import { pipe } from 'fp-ts/dist/function'
import { Functor, Functor1, Functor2C, Functor3, Functor3C } from 'fp-ts/dist/Functor'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { Ask, Ask1, Ask2, Ask3, Ask3C } from './Ask'

export function asks<F extends URIS, A>(
  M: Ask1<F, A> & Functor1<F>,
): <B>(f: (asked: A) => B) => Kind<F, B>

export function asks<F extends URIS2, A>(
  M: Ask2<F, A> & Functor2C<F, A>,
): <B>(f: (asked: A) => B) => Kind2<F, A, B>

export function asks<F extends URIS3, A>(
  M: Ask3<F, A> & Functor3C<F, A>,
): <R, B>(f: (asked: A) => B) => Kind3<F, R, A, B>

export function asks<F extends URIS3, A>(
  M: Ask3C<F, A> & Functor3<F>,
): <E, B>(f: (asked: A) => B) => Kind3<F, A, E, B>

export function asks<F, A>(M: Ask<F, A> & Functor<F>): <B>(f: (asked: A) => B) => HKT<F, B>

export function asks<F, A>(M: Ask<F, A> & Functor<F>) {
  return <B>(f: (asked: A) => B): HKT<F, B> => pipe(M.ask(), M.map(f))
}

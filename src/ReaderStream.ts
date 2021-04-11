import { Either } from 'fp-ts/Either'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'

import { Arity1, pipe } from './function'
import * as S from './Stream'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface ReaderStream<R, A> extends Re.Reader<R, S.Stream<A>> {}

export type GetRequirements<A> = A extends ReaderStream<infer R, any> ? R : never
export type GetValue<A> = A extends ReaderStream<any, infer R> ? R : never

export const ap: <R, A>(
  fa: ReaderStream<R, A>,
) => <B>(fab: ReaderStream<R, Arity1<A, B>>) => ReaderStream<R, B> = RT.ap(S.Apply)

export const chain = RT.chain(S.Chain) as <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>,
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>

export const chainFirst = <A, R, B>(f: (a: A) => ReaderStream<R, B>) => (
  ma: ReaderStream<R, A>,
): ReaderStream<R, A> =>
  pipe(
    ma,
    chain((a) =>
      pipe(
        a,
        f,
        chain(() => of(a)),
      ),
    ),
  )

export const fromReader: <R, A>(ma: Re.Reader<R, A>) => ReaderStream<R, A> = RT.fromReader(
  S.Pointed,
)

export const map: <A, B>(
  f: (a: A) => B,
) => <R>(fa: ReaderStream<R, A>) => ReaderStream<R, B> = RT.map(S.Functor)

export const of: <A, R = unknown>(a: A) => ReaderStream<R, A> = RT.of(S.Pointed)

export function chainRec<A, E, B>(
  f: (value: A) => ReaderStream<E, Either<A, B>>,
): (value: A) => ReaderStream<E, B> {
  return (value) => (env) => S.chainRec((a: A) => f(a)(env))(value)
}

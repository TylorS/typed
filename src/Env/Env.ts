import { Arity1 } from '@fp/lambda'
import { Apply, chainRec as chainRec_, Functor, Monad, Pointed, Resume } from '@fp/Resume'
import { Either } from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'
import { Reader } from 'fp-ts/dist/Reader'
import {
  ap as ap_,
  ask as ask_,
  asks as asks_,
  chain as chain_,
  fromReader as fromReader_,
  map as map_,
  of as of_,
} from 'fp-ts/dist/ReaderT'

export interface Env<E, A> extends Reader<E, Resume<A>> {}

export const of: <A, R>(a: A) => Env<R, A> = of_(Pointed)

export const ask: <R>() => Env<R, R> = ask_(Pointed)

export const asks: <R, A>(f: (r: R) => A) => Env<R, A> = asks_(Pointed)

export const chain = chain_(Monad) as <A, R1, B>(
  f: (a: A) => Env<R1, B>,
) => <R2>(ma: Env<R2, A>) => Env<R1 & R2, B>

export const fromReader: <R, A>(ma: Reader<R, A>) => Env<R, A> = fromReader_(Pointed)

export const map: <A, B>(f: (a: A) => B) => <R>(fa: Env<R, A>) => Env<R, B> = map_(Functor)

export const ap = ap_(Apply) as <R1, A>(
  fa: Env<R1, A>,
) => <R2, B>(fab: Env<R2, Arity1<A, B>>) => Env<R1 & R2, B>

export const chainRec = <A, R, B>(f: (a: A) => Env<R, Either<A, B>>) => (value: A): Env<R, B> => (
  r,
) =>
  pipe(
    value,
    chainRec_((a: A) => f(a)(r)),
  )

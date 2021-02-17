import * as E from '@typed/fp/Env'
import { MonadRec3 } from '@typed/fp/MonadRec'
import * as R from '@typed/fp/Resume'
import { sync } from '@typed/fp/Resume'
import { Alt3 } from 'fp-ts/Alt'
import { Apply3 } from 'fp-ts/Apply'
import { Bifunctor3 } from 'fp-ts/Bifunctor'
import * as Ei from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import { FromEither3 } from 'fp-ts/FromEither'
import { FromIO3 } from 'fp-ts/FromIO'
import { FromTask3 } from 'fp-ts/FromTask'
import { constant, Lazy, pipe } from 'fp-ts/function'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

import { EnvEither } from './EnvEither'

export const left: <E, FE, A = never>(e: E) => EnvEither<FE, E, A> = ET.left(E.Pointed)

export const right: <A, FE, E = never>(a: A) => EnvEither<FE, E, A> = ET.right(E.Pointed)

export const leftEnv: <E, FE, A = never>(e: E.Env<FE, E>) => EnvEither<FE, E, A> = ET.leftF(
  E.Functor,
)

export const rightEnv: <FE, A, E = never>(e: E.Env<FE, A>) => EnvEither<FE, E, A> = ET.rightF(
  E.Functor,
)

export const URI = '@typed/fp/EnvEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: EnvEither<R, E, A>
  }
}

export const map: <A, B>(
  f: (a: A) => B,
) => <FE, E>(fa: EnvEither<FE, E, A>) => EnvEither<FE, E, B> = ET.map(E.Functor)

export const Functor: Functor3<URI> = {
  URI,
  map,
}

export const Pointed: Pointed3<URI> = {
  ...Functor,
  of: right,
}

export const chain = ET.chain(E.Monad) as <A, ME1, E, B>(
  f: (a: A) => EnvEither<ME1, E, B>,
) => <ME2>(ma: EnvEither<ME2, E, A>) => EnvEither<ME1 & ME2, E, B>

export const Monad: Monad3<URI> = {
  ...Pointed,
  chain,
}

export const chainRec = <A, ME, E, B>(f: (a: A) => EnvEither<ME, E, Ei.Either<A, B>>) => (
  value: A,
): EnvEither<ME, E, B> => (r) =>
  pipe(
    value,
    R.chainRec((a) =>
      pipe(
        r,
        f(a),
        R.map(
          (either): Ei.Either<A, Ei.Either<E, B>> => {
            if (Ei.isLeft(either)) {
              return Ei.right(either)
            }

            if (Ei.isLeft(either.right)) {
              return Ei.left(either.right.left)
            }

            return Ei.right(either.right)
          },
        ),
      ),
    ),
  )

export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

export const ap = ET.ap(E.Apply) as <FE1, E, A>(
  fa: EnvEither<FE1, E, A>,
) => <FE2, B>(fab: EnvEither<FE2, E, (a: A) => B>) => EnvEither<FE1 & FE2, E, B>

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const alt = ET.alt(E.Monad) as <ME1, E, A>(
  second: Lazy<EnvEither<ME1, E, A>>,
) => <ME2>(first: EnvEither<ME2, E, A>) => EnvEither<ME1 & ME2, E, A>

export const Alt: Alt3<URI> = {
  ...Functor,
  alt,
}

export const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => <FE>(fea: EnvEither<FE, E, A>) => EnvEither<FE, G, B> = ET.bimap(E.Functor)

export const mapLeft: <E, G>(
  f: (e: E) => G,
) => <FE, A>(fea: EnvEither<FE, E, A>) => EnvEither<FE, G, A> = ET.mapLeft(E.Functor)

export const Bifunctor: Bifunctor3<URI> = {
  ...Functor,
  mapLeft,
  bimap,
}

export const getOrElse = ET.getOrElse(E.Monad) as <E, ME1, A>(
  onLeft: (e: E) => E.Env<ME1, A>,
) => <ME2>(ma: EnvEither<ME2, E, A>) => E.Env<ME1 & ME2, A>

export const orElse = ET.orElse(E.Monad) as <E1, ME1, E2, A>(
  onLeft: (e: E1) => EnvEither<ME1, E2, A>,
) => <ME2>(ma: EnvEither<ME2, E1, A>) => EnvEither<ME1 & ME2, E2, A>

export const swap: <FE, E, A>(ma: EnvEither<FE, E, A>) => EnvEither<FE, A, E> = ET.swap(E.Functor)
export const toUnion: <R, E, A>(fa: EnvEither<R, E, A>) => E.Env<R, E | A> = ET.toUnion(E.Functor)

export const match = ET.match(E.Monad) as <E, R1, B, A, R2, C>(
  onLeft: (e: E) => E.Env<R1, B>,
  onRight: (a: A) => E.Env<R2, C>,
) => (ma: EnvEither<R1, E, A>) => E.Env<R1 & R2, B | C>

export const FromIO: FromIO3<URI> = {
  URI,
  fromIO: (io) => rightEnv(E.fromReader(io)),
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask3<URI> = {
  ...FromIO,
  fromTask: (task) => rightEnv(E.fromTask(task)),
}

export const fromTask = FromTask.fromTask

export const fromEither = <E, A, R = never>(either: Ei.Either<E, A>): EnvEither<R, E, A> =>
  pipe(either, constant, sync, constant)

export const FromEither: FromEither3<URI> = {
  URI,
  fromEither,
}

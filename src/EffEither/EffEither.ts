import * as Eff from '@typed/fp/Eff'
import { chainRec as chainRec_ } from '@typed/fp/EnvEither'
import { fromIO, pure } from '@typed/fp/Fx'
import { MonadRec3 } from '@typed/fp/MonadRec'
import { Widen, WideningOptions } from '@typed/fp/Widen'
import { Alt3 } from 'fp-ts/Alt'
import { Apply3 } from 'fp-ts/Apply'
import { Bifunctor3 } from 'fp-ts/Bifunctor'
import { Either } from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import { FromEither3 } from 'fp-ts/FromEither'
import { FromIO3 } from 'fp-ts/FromIO'
import { flow, Lazy, pipe } from 'fp-ts/function'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

export interface EffEither<R, E, A> extends Eff.Eff<R, Either<E, A>> {}

export interface EffEitherWiden extends WideningOptions {
  2: 'union'
  3: 'intersection'
}

/**
 * Extract the resources that are required to run a given EffEither
 */
export type GetRequirements<A> = A extends EffEither<infer R, any, any>
  ? Widen<R, 'intersection'>
  : never

/**
 * Extract the left value from an EffEither
 */
export type GetLeft<A> = A extends EffEither<any, infer R, any> ? R : never

/**
 * Extract the right value from an EffEither
 */
export type GetRight<A> = A extends EffEither<any, any, infer R> ? R : never

export const left: <E, FE, A = never>(e: E) => EffEither<FE, E, A> = ET.left(Eff.Pointed)

export const right: <A, FE, E = never>(a: A) => EffEither<FE, E, A> = ET.right(Eff.Pointed)

export const leftEff: <E, FE, A = never>(e: Eff.Eff<FE, E>) => EffEither<FE, E, A> = ET.leftF(
  Eff.Functor,
)

export const rightEff: <FE, A, E = never>(e: Eff.Eff<FE, A>) => EffEither<FE, E, A> = ET.rightF(
  Eff.Functor,
)

export const URI = '@typed/fp/EffEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: EffEither<R, E, A>
  }
}

export const map: <A, B>(
  f: (a: A) => B,
) => <FE, E>(fa: EffEither<FE, E, A>) => EffEither<FE, E, B> = ET.map(Eff.Functor)

export const Functor: Functor3<URI> = {
  URI,
  map,
}

export const Pointed: Pointed3<URI> = {
  ...Functor,
  of: right,
}

export const chain = ET.chain(Eff.Monad) as <A, ME1, E1, B>(
  f: (a: A) => EffEither<ME1, E1, B>,
) => <ME2, E2>(ma: EffEither<ME2, E2, A>) => EffEither<ME1 & ME2, E1 | E2, B>

export const Monad: Monad3<URI> = {
  ...Pointed,
  chain,
}

export const chainRec = <A, ME, E, B>(f: (a: A) => EffEither<ME, E, Either<A, B>>) => (
  value: A,
): EffEither<ME, E, B> => Eff.fromEnv(flow(pipe(value, chainRec_(flow(f, Eff.toEnv)))))

export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

export const ap = ET.ap(Eff.Apply) as <FE1, E1, A>(
  fa: EffEither<FE1, E1, A>,
) => <FE2, E2, B>(fab: EffEither<FE2, E2, (a: A) => B>) => EffEither<FE1 & FE2, E1 | E2, B>

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const alt = ET.alt(Eff.Monad) as <MR1, E1, A>(
  second: Lazy<EffEither<MR1, E1, A>>,
) => <MR2, E2>(first: EffEither<MR2, E2, A>) => EffEither<MR1 & MR2, E1 | E2, A>

export const Alt: Alt3<URI> = {
  ...Functor,
  alt,
}

export const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => <FE>(fea: EffEither<FE, E, A>) => EffEither<FE, G, B> = ET.bimap(Eff.Functor)

export const mapLeft: <E, G>(
  f: (e: E) => G,
) => <FE, A>(fea: EffEither<FE, E, A>) => EffEither<FE, G, A> = ET.mapLeft(Eff.Functor)

export const Bifunctor: Bifunctor3<URI> = {
  ...Functor,
  mapLeft,
  bimap,
}

export const FromEither: FromEither3<URI> = {
  URI,
  fromEither: pure,
}

export const FromIO: FromIO3<URI> = {
  URI,
  fromIO: flow(fromIO, rightEff),
}

export const getOrElse = ET.getOrElse(Eff.Monad) as <E, ME1, A>(
  onLeft: (e: E) => Eff.Eff<ME1, A>,
) => <ME2>(ma: EffEither<ME2, E, A>) => Eff.Eff<ME1 & ME2, A>

export const orElse = ET.orElse(Eff.Monad) as <E1, ME1, E2, A>(
  onLeft: (e: E1) => EffEither<ME1, E2, A>,
) => <ME2>(ma: EffEither<ME2, E1, A>) => EffEither<ME1 & ME2, E2, A>

export const swap: <FE, E, A>(ma: EffEither<FE, E, A>) => EffEither<FE, A, E> = ET.swap(Eff.Functor)

export const toUnion: <R, E, A>(fa: EffEither<R, E, A>) => Eff.Eff<R, E | A> = ET.toUnion(
  Eff.Functor,
)

export const match = ET.match(Eff.Monad) as <E, R1, B, A, R2, C>(
  onLeft: (e: E) => Eff.Eff<R1, B>,
  onRight: (a: A) => Eff.Eff<R2, C>,
) => (ma: EffEither<R1, E, A>) => Eff.Eff<R1 & R2, B | C>

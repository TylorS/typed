import * as R from '@typed/fp/Resume'
import { Alt2 } from 'fp-ts/Alt'
import { Apply2 } from 'fp-ts/Apply'
import { Bifunctor2 } from 'fp-ts/Bifunctor'
import * as ET from 'fp-ts/EitherT'
import { Lazy } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import { ResumeEither } from './ResumeEither'

export const left = ET.left(R.Pointed)
export const right = ET.right(R.Pointed)
export const rightFromResume = ET.rightF(R.Functor)
export const leftFromResume = ET.leftF(R.Functor)

export const URI = '@typed/fp/ResumeEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ResumeEither<E, A>
  }
}

export const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: ResumeEither<E, A>) => ResumeEither<E, B> = ET.map(R.Functor)

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const Pointed: Pointed2<URI> = {
  ...Functor,
  of: right,
}

export const chain = ET.chain(R.Monad) as <A, E1, B>(
  f: (a: A) => ResumeEither<E1, B>,
) => <E2>(ma: ResumeEither<E2, A>) => ResumeEither<E1 | E2, B>

export const Chain: Monad2<URI> = {
  ...Pointed,
  chain,
}

export const ap = ET.ap(R.Apply) as <E1, A>(
  fa: ResumeEither<E1, A>,
) => <E2, B>(fab: ResumeEither<E2, (a: A) => B>) => ResumeEither<E1 | E2, B>

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const alt = ET.alt(R.Monad) as <E1, A>(
  second: Lazy<ResumeEither<E1, A>>,
) => <E2>(first: ResumeEither<E2, A>) => ResumeEither<E1 | E2, A>

export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

export const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => (fea: ResumeEither<E, A>) => ResumeEither<G, B> = ET.bimap(R.Functor)

export const mapLeft: <E, G>(
  f: (e: E) => G,
) => <A>(fea: ResumeEither<E, A>) => ResumeEither<G, A> = ET.mapLeft(R.Functor)

export const Bifunctor: Bifunctor2<URI> = {
  ...Functor,
  mapLeft,
  bimap,
}

export const getOrElse: <E, A>(
  onLeft: (e: E) => R.Resume<A>,
) => (ma: ResumeEither<E, A>) => R.Resume<A> = ET.getOrElse(R.Monad)

export const orElse: <E1, E2, A>(
  onLeft: (e: E1) => ResumeEither<E2, A>,
) => (ma: ResumeEither<E1, A>) => ResumeEither<E2, A> = ET.orElse(R.Monad)

export const swap: <E, A>(ma: ResumeEither<E, A>) => ResumeEither<A, E> = ET.swap(R.Functor)

export const toUnion: <E, A>(fa: ResumeEither<E, A>) => R.Resume<E | A> = ET.toUnion(R.Functor)

export const match: <E, B, A>(
  onLeft: (e: E) => R.Resume<B>,
  onRight: (a: A) => R.Resume<B>,
) => (ma: ResumeEither<E, A>) => R.Resume<B> = ET.match(R.Monad)

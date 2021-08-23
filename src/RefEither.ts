import * as Ei from 'fp-ts/Either'
import { Lazy, pipe } from 'fp-ts/function'

import * as Ref from './Ref'
import * as RefT from './RefT'

export interface RefEither<R, I, E, A> extends Ref.Ref<R, I, Ei.Either<E, A>> {}

export function getOrElse<A>(f: Lazy<A>) {
  return <R, I, E>(ref: RefEither<R, I, E, A>): Ref.Ref<R, I, A> =>
    pipe(ref, Ref.map(Ei.getOrElse(f)))
}

export function getOrElseW<B>(f: Lazy<B>) {
  return <R, I, E, A>(ref: RefEither<R, I, E, A>): Ref.Ref<R, I, A | B> =>
    pipe(ref, Ref.map(Ei.getOrElseW(f)))
}

export const map = RefT.map(Ei.Functor)

export const bimap = RefT.bimap(Ei.Bifunctor)

export const alt = RefT.alt(Ei.Alt)

export const ap = RefT.ap(Ei.Apply)

export const apS = RefT.apS(Ei.Apply)

export const apT = RefT.apT(Ei.Apply)

export const bindTo = RefT.bindTo(Ei.Functor)

export const chain = RefT.chain(Ei.Chain)

export const extend = RefT.extend(Ei.Extend)

export const tupled = RefT.tupled(Ei.Functor)

export const reduce = RefT.reduce(Ei.Foldable)

export const reduceRight = RefT.reduceRight(Ei.Foldable)

export const foldMap = RefT.foldMap(Ei.Foldable)

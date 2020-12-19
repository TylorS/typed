import { Arity1 } from '@typed/fp/common/exports'
import { ChainRec, ChainRec1, ChainRec2, ChainRec3 } from 'fp-ts/ChainRec'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad3 } from 'fp-ts/Monad'

import { createFxToMonad } from './createFxToMonad'
import { createStackSafeFxToMonad } from './createStackSafeFxToMonad'
import { doFx } from './doFx'
import { Fx } from './Fx'
import { createLiftFx } from './liftFx'
import { pure } from './pure'

// Monad transformer for working with Fx-based do-notation

export interface FxT<F, A> extends Fx<readonly HKT<F, unknown>[], A> {}
export interface FxT1<F extends URIS, A> extends Fx<readonly Kind<F, A>[], A> {}
export interface FxT2<F extends URIS2, E, A> extends Fx<readonly Kind2<F, E, A>[], A> {}
export interface FxT3<F extends URIS3, R, E, A> extends Fx<readonly Kind3<F, R, E, A>[], A> {}

export interface FxM<F> {
  readonly of: <A>(value: A) => FxT<F, A>
  readonly ap: <A, B>(fab: FxT<F, Arity1<A, B>>, fa: FxT<F, A>) => FxT<F, B>
  readonly chain: <A, B>(fa: FxT<F, A>, f: Arity1<A, FxT<F, B>>) => FxT<F, B>
  readonly map: <A, B>(fa: FxT<F, A>, f: Arity1<A, B>) => FxT<F, B>
  readonly fromMonad: <A>(hkt: HKT<F, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<HKT<F, any>>, R>(fx: Fx<E, R>) => HKT<F, R>
}

export interface FxM1<F extends URIS> {
  readonly of: <A>(value: A) => FxT1<F, A>
  readonly ap: <A, B>(fab: FxT1<F, Arity1<A, B>>, fa: FxT1<F, A>) => FxT1<F, B>
  readonly chain: <A, B>(fa: FxT1<F, A>, f: Arity1<A, FxT1<F, B>>) => FxT1<F, B>
  readonly map: <A, B>(fa: FxT1<F, A>, f: Arity1<A, B>) => FxT1<F, B>
  readonly fromMonad: <A>(hkt: Kind<F, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<Kind<F, any>>, R>(fx: Fx<E, R>) => Kind<F, R>
}

export interface FxM2<F extends URIS2> {
  readonly of: <E, A>(value: A) => FxT2<F, E, A>
  readonly ap: <E, A, B>(fab: FxT2<F, E, Arity1<A, B>>, fa: FxT2<F, E, A>) => FxT2<F, E, B>
  readonly chain: <E, A, B>(fa: FxT2<F, E, A>, f: Arity1<A, FxT2<F, E, B>>) => FxT2<F, E, B>
  readonly map: <E, A, B>(fa: FxT2<F, E, A>, f: Arity1<A, B>) => FxT2<F, E, B>
  readonly fromMonad: <E, A>(hkt: Kind2<F, E, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<Kind2<F, S, any>>, S, R>(
    fx: Fx<E, R>,
  ) => Kind2<F, S, R>
}

export interface FxM3<F extends URIS3> {
  readonly of: <R, E, A>(value: A) => FxT3<F, R, E, A>
  readonly ap: <R, E, A, B>(
    fab: FxT3<F, R, E, Arity1<A, B>>,
    fa: FxT3<F, R, E, A>,
  ) => FxT3<F, R, E, B>
  readonly chain: <R, E, A, B>(
    fa: FxT3<F, R, E, A>,
    f: Arity1<A, FxT3<F, R, E, B>>,
  ) => FxT3<F, R, E, B>
  readonly map: <R, E, A, B>(fa: FxT3<F, R, E, A>, f: Arity1<A, B>) => FxT3<F, R, E, B>
  readonly fromMonad: <R, E, A>(hkt: Kind3<F, R, E, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<Kind3<F, S, T, any>>, S, T, R>(
    fx: Fx<E, R>,
  ) => Kind3<F, S, T, R>
}

export function getStackSafeFxM<F extends URIS>(monad: Monad1<F> & ChainRec1<F>): FxM1<F>
export function getStackSafeFxM<F extends URIS2>(monad: Monad2<F> & ChainRec2<F>): FxM2<F>
export function getStackSafeFxM<F extends URIS3>(monad: Monad3<F> & ChainRec3<F>): FxM3<F>

/**
 * Fx monad transformer for monads supporting ChainRec for stack-safety.
 */
export function getStackSafeFxM<F extends string>(monad: Monad<F> & ChainRec<F>): FxM<F> {
  const fromMonad = createLiftFx<F>()
  const toMonad = createStackSafeFxToMonad(monad)
  const ap = <A, B>(fab: FxT<F, Arity1<A, B>>, fa: FxT<F, A>): FxT<F, B> =>
    fromMonad(monad.ap(toMonad(fab), toMonad(fa)))

  return {
    of: pure,
    chain: chain_,
    map: map_,
    ap,
    fromMonad,
    toMonad,
  }
}

export function getFxM<F extends URIS>(monad: Monad1<F>): FxM1<F>
export function getFxM<F extends URIS2>(monad: Monad2<F>): FxM2<F>
export function getFxM<F extends URIS3>(monad: Monad3<F>): FxM3<F>

/**
 * Fx monad transformer for monads. Is NOT stack-safe unless your Monad is asynchronous.
 */
export function getFxM<F extends string>(monad: Monad<F>): FxM<F> {
  const fromMonad = createLiftFx<F>()
  const toMonad = createFxToMonad(monad)
  const ap = <A, B>(fab: FxT<F, Arity1<A, B>>, fa: FxT<F, A>): FxT<F, B> =>
    fromMonad(monad.ap(toMonad(fab), toMonad(fa)))

  return {
    of: pure,
    chain: chain_,
    map: map_,
    ap,
    fromMonad,
    toMonad,
  }
}

const chain_ = <A, B>(fa: FxT<any, A>, f: (value: A) => FxT<any, B>): FxT<any, B> =>
  doFx(function* () {
    const a = yield* fa

    return yield* f(a)
  })

const map_ = <A, B>(fa: FxT<any, A>, f: (value: A) => B): FxT<any, B> =>
  doFx(function* () {
    return f(yield* fa)
  })

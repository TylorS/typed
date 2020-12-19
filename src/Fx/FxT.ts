import { And, Arity1 } from '@typed/fp/common/exports'
import { ChainRec, ChainRec1, ChainRec2, ChainRec3 } from 'fp-ts/ChainRec'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad3 } from 'fp-ts/Monad'
import { U } from 'ts-toolbelt'

import { createFxToMonad } from './createFxToMonad'
import { createStackSafeFxToMonad } from './createStackSafeFxToMonad'
import { doFx } from './doFx'
import { Fx } from './Fx'
import { createLiftFx, LiftFx } from './liftFx'
import { pure } from './pure'

// Monad transformer for working with Fx-based do-notation

export interface FxT<F, A> extends Fx<readonly HKT<F, unknown>[], A> {}
export interface FxT1<F extends URIS, A> extends Fx<readonly Kind<F, A>[], A> {}
export interface FxT2<F extends URIS2, E, A> extends Fx<readonly Kind2<F, E, A>[], A> {}
export interface FxT3<F extends URIS3, R, E, A> extends Fx<readonly Kind3<F, R, E, A>[], A> {}

export type Widening = 'union' | 'intersection'

export interface WideningOptions {
  readonly 2?: Widening
  readonly 3?: Widening
}

export type Widen<A, W extends Widening | undefined> = W extends 'intersection'
  ? And<U.ListOf<A>>
  : A

export interface UnionWiden extends WideningOptions {
  readonly 2: 'union'
  readonly 3: 'union'
}

export interface IntersectionWiden extends WideningOptions {
  readonly 2: 'intersection'
  readonly 3: 'intersection'
}

export interface FxM<F> {
  readonly of: <A>(value: A) => FxT<F, A>
  readonly ap: <A, B>(fab: FxT<F, Arity1<A, B>>, fa: FxT<F, A>) => FxT<F, B>
  readonly chain: <A, B>(fa: FxT<F, A>, f: Arity1<A, FxT<F, B>>) => FxT<F, B>
  readonly map: <A, B>(fa: FxT<F, A>, f: Arity1<A, B>) => FxT<F, B>
  readonly fromMonad: <A>(hkt: HKT<F, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<HKT<F, any>>, R>(fx: Fx<E, R>) => HKT<F, R>
  readonly doMonad: <Y extends HKT<F, any>, R>(
    f: (lift: LiftFx<F>) => Generator<Y, R, any>,
  ) => Fx<readonly [...U.ListOf<Y>], R>
}

// TODO: allow renaming from/to/do*

export interface FxM1<F extends URIS> {
  readonly of: <A>(value: A) => FxT1<F, A>
  readonly ap: <A, B>(fab: FxT1<F, Arity1<A, B>>, fa: FxT1<F, A>) => FxT1<F, B>
  readonly chain: <A, B>(fa: FxT1<F, A>, f: Arity1<A, FxT1<F, B>>) => FxT1<F, B>
  readonly map: <A, B>(fa: FxT1<F, A>, f: Arity1<A, B>) => FxT1<F, B>
  readonly fromMonad: <A>(hkt: Kind<F, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<Kind<F, any>>, R>(fx: Fx<E, R>) => Kind<F, R>
  readonly doMonad: <Y extends Kind<F, any>, R>(
    f: (lift: LiftFx<F>) => Generator<Y, R, any>,
  ) => Fx<readonly [...U.ListOf<Y>], R>
}

export interface FxM2<F extends URIS2, W extends WideningOptions = UnionWiden> {
  readonly of: <E, A>(value: A) => FxT2<F, E, A>
  readonly ap: <E, A, B>(fab: FxT2<F, E, Arity1<A, B>>, fa: FxT2<F, E, A>) => FxT2<F, E, B>
  readonly chain: <E, A, B>(fa: FxT2<F, E, A>, f: Arity1<A, FxT2<F, E, B>>) => FxT2<F, E, B>
  readonly map: <E, A, B>(fa: FxT2<F, E, A>, f: Arity1<A, B>) => FxT2<F, E, B>
  readonly fromMonad: <E, A>(hkt: Kind2<F, E, A>) => Fx<readonly [typeof hkt], A>
  readonly toMonad: <E extends ReadonlyArray<Kind2<F, any, any>>, R>(
    fx: Fx<E, R>,
  ) => Kind2<F, Kind2E<F, E[number], W[2]>, R>

  readonly doMonad: <Y extends Kind2<F, any, any>, R>(
    f: (lift: LiftFx<F>) => Generator<Y, R, any>,
  ) => Fx<readonly [...U.ListOf<Y>], R>
}

export type Kind2E<F extends URIS2, A, W extends Widening | undefined = 'union'> = [A] extends [
  Kind2<F, infer R, any>,
]
  ? Widen<R, W>
  : never

export interface FxM3<F extends URIS3, W extends WideningOptions = UnionWiden> {
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

  readonly toMonad: <E extends ReadonlyArray<Kind3<F, any, any, any>>, R>(
    fx: Fx<E, R>,
  ) => Kind3<F, Kind3R<F, E[number], W[3]>, Kind3E<F, E[number], W[2]>, R>

  readonly doMonad: <Y extends Kind3<F, any, any, any>, R>(
    f: (lift: LiftFx<F>) => Generator<Y, R, any>,
  ) => Fx<readonly [...U.ListOf<Y>], R>
}

export type Kind3R<F extends URIS3, A, W extends Widening | undefined = 'union'> = [A] extends [
  Kind3<F, infer R, any, any>,
]
  ? Widen<R, W>
  : never

export type Kind3E<F extends URIS3, A, W extends Widening | undefined = 'union'> = [A] extends [
  Kind3<F, any, infer R, any>,
]
  ? Widen<R, W>
  : never

export function getStackSafeFxM<F extends URIS>(monad: Monad1<F> & ChainRec1<F>): FxM1<F>
export function getStackSafeFxM<F extends URIS2, W extends WideningOptions = UnionWiden>(
  monad: Monad2<F> & ChainRec2<F>,
): FxM2<F, W>
export function getStackSafeFxM<F extends URIS3, W extends WideningOptions = UnionWiden>(
  monad: Monad3<F> & ChainRec3<F>,
): FxM3<F, W>

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
    doMonad: (f) => doFx(() => f(fromMonad)),
  }
}

export function getFxM<F extends URIS>(monad: Monad1<F>): FxM1<F>
export function getFxM<F extends URIS2, W extends WideningOptions = UnionWiden>(
  monad: Monad2<F>,
): FxM2<F, W>
export function getFxM<F extends URIS3, W extends WideningOptions = UnionWiden>(
  monad: Monad3<F>,
): FxM3<F, W>

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
    doMonad: (f) => doFx(() => f(fromMonad)),
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

import { Fx, LiftFx } from '@fp/Fx'
import { Arity1 } from '@fp/lambda'
import { GetKind2E, GetKind3E, GetKind3R, UnionWiden, Widen, WideningOptions } from '@fp/Widen'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { FxT, FxT1, FxT2, FxT3 } from './FxT'

export interface FxM<F> {
  readonly of: <A>(value: A) => FxT<F, A>
  readonly ap: <A>(fa: FxT<F, A>) => <B>(fab: FxT<F, Arity1<A, B>>) => FxT<F, B>
  readonly chain: <A, B>(f: Arity1<A, FxT<F, B>>) => (fa: FxT<F, A>) => FxT<F, B>
  readonly map: <A, B>(f: Arity1<A, B>) => (fa: FxT<F, A>) => FxT<F, B>

  readonly fromMonad: <A>(hkt: HKT<F, A>) => Fx<typeof hkt, A>
  readonly toMonad: <E extends HKT<F, any>, R>(fx: Fx<E, R>) => HKT<F, R>
  readonly doMonad: <Y extends HKT<F, any>, R, N = unknown>(
    f: (lift: LiftFx<F>) => Generator<Y, R, N>,
  ) => Fx<Y, R, N>
}

export interface FxM1<F extends URIS> {
  readonly of: <A>(value: A) => FxT1<F, A>
  readonly ap: <A>(fa: FxT1<F, A>) => <B>(fab: FxT1<F, Arity1<A, B>>) => FxT1<F, B>
  readonly chain: <A, B>(f: Arity1<A, FxT1<F, B>>) => (fa: FxT1<F, A>) => FxT1<F, B>
  readonly map: <A, B>(f: Arity1<A, B>) => (fa: FxT1<F, A>) => FxT1<F, B>
  readonly fromMonad: <A>(hkt: Kind<F, A>) => Fx<typeof hkt, A>
  readonly toMonad: <E extends Kind<F, any>, R>(fx: Fx<E, R>) => Kind<F, R>
  readonly doMonad: <Y extends Kind<F, any>, R, N = unknown>(
    f: (lift: LiftFx<F>) => Generator<Y, R, N>,
  ) => Fx<Y, R, N>
}

export interface FxM2<F extends URIS2, W extends WideningOptions = UnionWiden> {
  readonly of: <E, A>(value: A) => FxT2<F, E, A>

  readonly ap: <E1, A>(
    fa: FxT2<F, E1, A>,
  ) => <E2, B>(fab: FxT2<F, E2, Arity1<A, B>>) => FxT2<F, Widen<E1 | E2, W[2]>, B>

  readonly chain: <E, A, B>(
    f: Arity1<A, FxT2<F, E, B>>,
  ) => <E2>(fa: FxT2<F, E2, A>) => FxT2<F, Widen<E | E2, W[2]>, B>

  readonly map: <A, B>(f: Arity1<A, B>) => <E>(fa: FxT2<F, E, A>) => FxT2<F, E, B>

  readonly fromMonad: <E, A>(hkt: Kind2<F, E, A>) => Fx<typeof hkt, A>

  readonly toMonad: <E extends Kind2<F, any, any>, R>(
    fx: Fx<E, R>,
  ) => Kind2<F, GetKind2E<F, E, W[2]>, R>

  readonly doMonad: <Y extends Kind2<F, any, any>, R, N = unknown>(
    f: (lift: LiftFx<F>) => Generator<Y, R, N>,
  ) => Fx<Y, R, N>
}

export interface FxM2C<F extends URIS2, E, W extends WideningOptions = UnionWiden> {
  readonly of: <A>(value: A) => FxT2<F, E, A>

  readonly ap: <A>(
    fa: FxT2<F, E, A>,
  ) => <E2, B>(fab: FxT2<F, E2, Arity1<A, B>>) => FxT2<F, Widen<E | E2, W[2]>, B>

  readonly chain: <A, B>(
    f: Arity1<A, FxT2<F, E, B>>,
  ) => <E2>(fa: FxT2<F, E2, A>) => FxT2<F, Widen<E | E2, W[2]>, B>

  readonly map: <A, B>(f: Arity1<A, B>) => (fa: FxT2<F, E, A>) => FxT2<F, E, B>

  readonly fromMonad: <A>(hkt: Kind2<F, E, A>) => Fx<typeof hkt, A>

  readonly toMonad: <K extends Kind2<F, E, any>, R>(
    fx: Fx<K, R>,
  ) => Kind2<F, GetKind2E<F, K, W[2]>, R>

  readonly doMonad: <Y extends Kind2<F, E, any>, R, N = unknown>(
    f: (lift: LiftFx<F>) => Generator<Y, R, N>,
  ) => Fx<Y, R, N>
}

export interface FxM3<F extends URIS3, W extends WideningOptions = UnionWiden> {
  readonly of: <R, E, A>(value: A) => FxT3<F, R, E, A>

  readonly ap: <R, E, A>(
    fa: FxT3<F, R, E, A>,
  ) => <R2, E2, B>(
    fab: FxT3<F, R2, E2, Arity1<A, B>>,
  ) => FxT3<F, Widen<R | R2, W[3]>, Widen<E | E2, W[2]>, B>

  readonly chain: <R, E, A, B>(
    f: Arity1<A, FxT3<F, R, E, B>>,
  ) => <R2, E2>(fa: FxT3<F, R2, E2, A>) => FxT3<F, Widen<R | R2, W[3]>, Widen<E | E2, W[2]>, B>

  readonly map: <A, B>(f: Arity1<A, B>) => <R, E>(fa: FxT3<F, R, E, A>) => FxT3<F, R, E, B>

  readonly fromMonad: <R, E, A>(hkt: Kind3<F, R, E, A>) => Fx<typeof hkt, A>

  readonly toMonad: <E extends Kind3<F, any, any, any>, R>(
    fx: Fx<E, R>,
  ) => Kind3<F, GetKind3R<F, E, W[3]>, GetKind3E<F, E, W[2]>, R>

  readonly doMonad: <Y extends Kind3<F, any, any, any>, R, N = unknown>(
    f: (lift: LiftFx<F>) => Generator<Y, R, N>,
  ) => Fx<Y, R, N>
}

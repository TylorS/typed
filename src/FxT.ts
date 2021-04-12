import { Apply, Apply1, Apply2, Apply3, Apply4 } from 'fp-ts/Apply'
import { Either, left, match, right } from 'fp-ts/Either'
import { FromReader, FromReader2, FromReader3, FromReader3C, FromReader4 } from 'fp-ts/FromReader'
import { flow, identity, pipe } from 'fp-ts/function'
import { HKT, HKT2, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { Pointed, Pointed1, Pointed2, Pointed3, Pointed4 } from 'fp-ts/Pointed'
import { A, U } from 'ts-toolbelt'

import { Arity1 } from './function'
import { doFx, Fx } from './Fx/Fx'
import { ApplyVariance, Hkt, Initial } from './Hkt'
import { MonadRec, MonadRec1, MonadRec2, MonadRec2C, MonadRec3, MonadRec4 } from './MonadRec'
import {
  ProvideAll,
  ProvideAll2,
  ProvideAll3,
  ProvideAll4,
  ProvideSome,
  ProvideSome2,
  ProvideSome3,
  ProvideSome4,
  UseAll,
  UseAll2,
  UseAll3,
  UseAll4,
  UseSome,
  UseSome2,
  UseSome3,
  UseSome4,
} from './Provide'

export type FxT<F, Params extends readonly any[]> = Params extends readonly [...infer Init, infer R]
  ? Fx<Hkt<F, readonly [...Init, unknown]>, R>
  : never

export type LiftFx<F> = F extends URIS
  ? LiftFx1<F>
  : F extends URIS2
  ? LiftFx2<F>
  : F extends URIS3
  ? LiftFx3<F>
  : F extends URIS4
  ? LiftFx4<F>
  : LiftFxHKT<F>

export type LiftFx1<F extends URIS> = <A>(kind: Kind<F, A>) => Fx<Kind<F, A>, A>

export type LiftFx2<F extends URIS2> = <E, A>(
  kind: Kind2<F, OrUnknown<E>, A>,
) => Fx<Kind2<F, OrUnknown<E>, A>, A>

type IsNever<T> = A.Equals<[T], [never]> extends 1 ? true : false
type OrUnknown<T> = IsNever<T> extends true ? unknown : T

export type LiftFx3<F extends URIS3> = <R, E, A>(
  kind: Kind3<F, OrUnknown<R>, E, A>,
) => Fx<Kind3<F, OrUnknown<R>, E, A>, A>

export type LiftFx4<F extends URIS4> = <S, R, E, A>(
  kind: Kind4<F, S, OrUnknown<R>, E, A>,
) => Fx<Kind4<F, S, OrUnknown<R>, E, A>, A>

export type LiftFxHKT<F> = <A>(kind: HKT<F, A>) => Fx<HKT<F, A>, A>

/**
 * Create a lift function that will convert any F<A> into Fx<F<A>, A>
 */
export const liftFx = <F>() => lift_ as LiftFx<F>

function lift_<F, A>(hkt: HKT<F, A>): Fx<typeof hkt, A> {
  return {
    [Symbol.iterator]: function* () {
      const value: unknown = yield hkt

      return value as A
    },
  }
}

export function getDo<F extends URIS>(): <Y extends Kind<F, any>, R, N = unknown>(
  f: (lift: LiftFx1<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>

export function getDo<F extends URIS2, E = any>(): <Y extends Kind2<F, E, any>, R, N = unknown>(
  f: (lift: LiftFx2<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>

export function getDo<F extends URIS3, R = any, E = any>(): <
  Y extends Kind3<F, R, E, any>,
  Z,
  N = unknown
>(
  f: (lift: LiftFx3<F>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>

export function getDo<F extends URIS4, S = any, R = any, E = any>(): <
  Y extends Kind4<F, S, R, E, any>,
  Z,
  N = unknown
>(
  f: (lift: LiftFx4<F>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>

export function getDo<F>(): <Y extends HKT<F, any>, R, N = unknown>(
  f: (lift: LiftFxHKT<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>

export function getDo<F>() {
  const lift = liftFx<F>()

  return <Y extends Hkt<F, readonly [...any[], R]>, R, N = unknown>(
    f: (lift: LiftFxHKT<F>) => Generator<Y, R, N>,
  ): Fx<Y, R, N> => doFx(() => f(lift as LiftFxHKT<F>))
}

type Kind2E<F extends URIS2, E> = [E] extends [Kind2<F, infer R, any>] ? R : never

type Kind3E<F extends URIS3, E> = [E] extends [Kind3<F, any, infer R, any>] ? R : never
type Kind3R<F extends URIS3, E> = [E] extends [Kind3<F, infer R, any, any>] ? R : never

type Kind4E<F extends URIS4, E> = [E] extends [Kind4<F, any, any, infer R, any>] ? R : never
type Kind4R<F extends URIS4, E> = [E] extends [Kind4<F, any, infer R, any, any>] ? R : never
type Kind4S<F extends URIS4, E> = [E] extends [Kind4<F, infer R, any, any, any>] ? R : never

export function toMonad<F extends URIS>(
  M: MonadRec1<F>,
): <E extends Kind<F, any>, R>(fx: Fx<E, R>) => Kind<F, R>

export function toMonad<F extends URIS2>(
  M: MonadRec2<F>,
): <E extends Kind2<F, any, any>, R>(
  fx: Fx<E, R>,
) => Kind2<F, ApplyVariance<F, 'E', U.ListOf<Kind2E<F, E>>>, R>

export function toMonad<F extends URIS2, S>(
  M: MonadRec2C<F, S>,
): <E extends Kind2<F, S, any>, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonad<F extends URIS3>(
  M: MonadRec3<F>,
): <E extends Kind3<F, any, any, any>, R>(
  fx: Fx<E, R>,
) => Kind3<
  F,
  ApplyVariance<F, 'R', U.ListOf<Kind3R<F, E>>>,
  ApplyVariance<F, 'E', U.ListOf<Kind3E<F, E>>>,
  R
>

export function toMonad<F extends URIS4>(
  M: MonadRec4<F>,
): <E extends Kind4<F, any, any, any, any>, R>(
  fx: Fx<E, R>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', U.ListOf<Kind4S<F, E>>>,
  ApplyVariance<F, 'R', U.ListOf<Kind4R<F, E>>>,
  ApplyVariance<F, 'E', U.ListOf<Kind4E<F, E>>>,
  R
>

export function toMonad<F>(M: MonadRec<F>): <E, R>(fx: Fx<E, R>) => HKT<F, R>

/**
 * Using a ChainRec instance we can create a stack-safe interpreter for do-notation
 * using Fx + generators.
 */
export function toMonad<F>(M: MonadRec<F>) {
  return function fxToMonad<E extends HKT<F, any>, R>(fx: Fx<E, R>): HKT<F, R> {
    return pipe(
      M.of(fx[Symbol.iterator]),
      M.map((f) => f()),
      M.chain((generator) => {
        const result = generator.next()

        if (result.done) {
          return M.of(result.value)
        }

        return pipe(
          result.value,
          M.chain(
            M.chainRec((a) => {
              const result = generator.next(a)

              return result.done ? pipe(result.value, right, M.of) : pipe(result.value, M.map(left))
            }),
          ),
        )
      }),
    )
  }
}

export function map<F extends URIS>(): <A, B>(
  f: (value: A) => B,
) => (fx: FxT<F, [A]>) => FxT<F, [B]>

export function map<F extends URIS2>(): <A, B>(
  f: (value: A) => B,
) => <E>(fx: FxT<F, [E, A]>) => FxT<F, [E, B]>

export function map<F extends URIS3>(): <A, B>(
  f: (value: A) => B,
) => <R, E>(fx: FxT<F, [R, E, A]>) => FxT<F, [R, E, B]>

export function map<F extends URIS4>(): <A, B>(
  f: (value: A) => B,
) => <S, R, E>(fx: FxT<F, [S, R, E, A]>) => FxT<F, [S, R, E, B]>

export function map<F>(): <A, B>(f: (value: A) => B) => (fx: FxT<F, [A]>) => FxT<F, [B]>

export function map() {
  return map_
}

const map_ = <A, B>(f: (value: A) => B) => {
  return (hkt: FxT<unknown, [A]>): FxT<unknown, [B]> =>
    doFx(function* () {
      return f(yield* hkt)
    })
}

export function chain<F extends URIS>(): <A, B>(
  f: (value: A) => FxT<F, [B]>,
) => (fx: FxT<F, [A]>) => FxT<F, [ApplyVariance<F, 'A', [B, A]>]>

export function chain<F extends URIS2>(): <A, E1, B>(
  f: (value: A) => FxT<F, [E1, B]>,
) => <E2>(fx: FxT<F, [E2, A]>) => FxT<F, [ApplyVariance<F, 'E', [E1, E2]>, B]>

export function chain<F extends URIS3>(): <A, R1, E1, B>(
  f: (value: A) => FxT<F, [R1, E1, B]>,
) => <R2, E2>(
  fx: FxT<F, [R2, E2, A]>,
) => FxT<
  F,
  [ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, ApplyVariance<F, 'A', [B, A]>]
>

export function chain<F extends URIS4>(): <A, S1, R1, E1, B>(
  f: (value: A) => FxT<F, [S1, R1, E1, B]>,
) => <S2, R2, E2>(
  fx: FxT<F, [S2, R2, E2, A]>,
) => FxT<
  F,
  [
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    ApplyVariance<F, 'A', [B, A]>,
  ]
>

export function chain<F>(): <A, B>(f: (value: A) => FxT<F, [B]>) => (fx: FxT<F, [A]>) => FxT<F, [B]>

export function chain() {
  return chain_
}

const chain_ = <A, B>(f: (value: A) => FxT<unknown, [B]>) => {
  return (hkt: FxT<unknown, [A]>): FxT<unknown, [B]> =>
    doFx(function* () {
      const a = yield* hkt
      const b = yield* f(a as A)

      return b
    }) as FxT<unknown, [B]>
}

export function ap<F extends URIS>(
  M: MonadRec1<F> & Apply1<F>,
): <A>(fa: FxT<F, [A]>) => <B>(fab: FxT<F, [Arity1<A, B>]>) => FxT<F, [B]>

export function ap<F extends URIS2>(
  M: MonadRec2<F> & Apply2<F>,
): <E1, A>(
  fa: FxT<F, [E1, A]>,
) => <E2, B>(fab: FxT<F, [E2, Arity1<A, B>]>) => FxT<F, [ApplyVariance<F, 'E', [E1, E2]>, B]>

export function ap<F extends URIS2, E>(
  M: MonadRec2<F> & Apply2<F>,
): <A>(fa: FxT<F, [E, A]>) => <B>(fab: FxT<F, [E, Arity1<A, B>]>) => FxT<F, [E, B]>

export function ap<F extends URIS3>(
  M: MonadRec3<F> & Apply3<F>,
): <R1, E1, A>(
  fa: FxT<F, [R1, E1, A]>,
) => <R2, E2, B>(
  fab: FxT<F, [R2, E2, Arity1<A, B>]>,
) => FxT<F, [ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, B]>

export function ap<F extends URIS4>(
  M: MonadRec4<F> & Apply4<F>,
): <S1, R1, E1, A>(
  fa: FxT<F, [S1, R1, E1, A]>,
) => <S2, R2, E2, B>(
  fab: FxT<F, [S2, R2, E2, Arity1<A, B>]>,
) => FxT<
  F,
  [
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    B,
  ]
>

export function ap<F>(
  M: MonadRec<F> & Apply<F>,
): <A>(fa: FxT<F, [A]>) => <B>(fab: FxT<F, [Arity1<A, B>]>) => FxT<F, [B]>

export function ap<F>(M: MonadRec<F> & Apply<F>) {
  const lift = liftFx()
  const to = toMonad(M)

  return <A>(fa: FxT<F, [A]>) => <B>(fab: FxT<F, [Arity1<A, B>]>): FxT<F, [B]> =>
    pipe(fab, to, pipe(fa, to, M.ap), lift) as FxT<F, [B]>
}

export function chainRec<F extends URIS>(M: MonadRec1<F>): ChainRecFxT<F>
export function chainRec<F extends URIS2>(M: MonadRec2<F>): ChainRecFxT<F>
export function chainRec<F extends URIS3>(M: MonadRec3<F>): ChainRecFxT<F>
export function chainRec<F extends URIS4>(M: MonadRec4<F>): ChainRecFxT<F>
export function chainRec<F>(M: MonadRec<F>): ChainRecFxT<F> {
  return chainRec_(M) as ChainRecFxT<F>
}

export type ChainRecFxT<F> = F extends URIS2
  ? <A, E, B>(f: Arity1<A, FxT<F, [E, Either<A, B>]>>) => (a: A) => FxT<F, [E, B]>
  : F extends URIS3
  ? <A, R, E, B>(f: Arity1<A, FxT<F, [R, E, Either<A, B>]>>) => (a: A) => FxT<F, [R, E, B]>
  : F extends URIS4
  ? <A, S, R, E, B>(f: Arity1<A, FxT<F, [S, R, E, Either<A, B>]>>) => (a: A) => FxT<F, [S, R, E, B]>
  : <A, B>(f: Arity1<A, FxT<F, [Either<A, B>]>>) => (a: A) => FxT<F, [B]>

function chainRec_<F>(M: MonadRec<F>) {
  const to = toMonad(M)
  const lift = liftFx()

  return <A, B>(f: Arity1<A, FxT<F, [Either<A, B>]>>) => (a: A): FxT<F, [B]> => {
    const fbm = pipe(
      f(a),
      to,
      M.chain(
        match(
          M.chainRec((a) => pipe(a, f, to)),
          M.of,
        ),
      ),
    )

    return lift(fbm) as FxT<F, [B]>
  }
}

export function of<F extends URIS>(M: Pointed1<F>): <A>(value: A) => Fx<Hkt<F, [A]>, A>
export function of<F extends URIS2>(
  M: Pointed2<F>,
): <A, E = Initial<F, 'E'>>(value: A) => Fx<Hkt<F, [E, A]>, A>
export function of<F extends URIS3>(
  M: Pointed3<F>,
): <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(value: A) => Fx<Hkt<F, [R, E, A]>, A>
export function of<F extends URIS4>(
  M: Pointed4<F>,
): <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
) => Fx<Hkt<F, [S, R, E, A]>, A>
export function of<F>(M: Pointed<F>): <A>(value: A) => Fx<HKT<F, A>, A>

export function of<F>(M: Pointed<F>) {
  const lift = liftFx()

  return <A>(value: A) => lift(M.of(value))
}

export function ask<F extends URIS2>(M: FromReader2<F>): <A>() => Fx<Hkt<F, [A, A]>, A>
export function ask<F extends URIS3>(
  M: FromReader3<F>,
): <A>() => Fx<Hkt<F, [A, Initial<F, 'E'>, A]>, A>
export function ask<F extends URIS3, E>(M: FromReader3C<F, E>): <A>() => Fx<Hkt<F, [A, E, A]>, A>
export function ask<F extends URIS4>(
  M: FromReader4<F>,
): <A>() => Fx<Hkt<F, [Initial<F, 'S'>, A, Initial<F, 'E'>, A]>, A>
export function ask<F>(M: FromReader<F>): <A>() => Fx<HKT2<F, A, A>, A>

export function ask<F>(M: FromReader<F>) {
  const lift = liftFx()

  return () => lift(M.fromReader(identity))
}

export function asks<F extends URIS2>(
  M: FromReader2<F>,
): <A, B>(f: Arity1<A, B>) => Fx<Hkt<F, [A, B]>, B>
export function asks<F extends URIS3>(
  M: FromReader3<F>,
): <A, B>(f: Arity1<A, B>) => Fx<Hkt<F, [A, Initial<F, 'E'>, B]>, B>
export function asks<F extends URIS3, E>(
  M: FromReader3C<F, E>,
): <A, B>(f: Arity1<A, B>) => Fx<Hkt<F, [A, E, B]>, B>
export function asks<F extends URIS4>(
  M: FromReader4<F>,
): <A, B>(f: Arity1<A, B>) => Fx<Hkt<F, [Initial<F, 'S'>, A, Initial<F, 'E'>, B]>, B>
export function asks<F>(M: FromReader<F>): <A, B>(f: Arity1<A, B>) => Fx<HKT2<F, A, B>, B>

export function asks<F>(M: FromReader<F>) {
  return flow(M.fromReader, liftFx())
}

export function useSome<F extends URIS2>(
  M: UseSome2<F> & MonadRec2<F>,
): <A>(provided: A) => <B, T>(fx: Fx<Hkt<F, [A & B, unknown]>, T>) => Fx<Hkt<F, [B, unknown]>, T>
export function useSome<F extends URIS3>(
  M: UseSome3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <B, E, T>(fx: Fx<Hkt<F, [A & B, E, unknown]>, T>) => Fx<Hkt<F, [B, E, unknown]>, T>
export function useSome<F extends URIS4>(
  M: UseSome4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <B, S, E, T>(fx: Fx<Hkt<F, [S, A & B, E, unknown]>, T>) => Fx<Hkt<F, [S, B, E, unknown]>, T>
export function useSome<F>(
  M: UseSome<F> & MonadRec<F>,
): <A>(provided: A) => <B, T>(fx: Fx<HKT2<F, A & B, unknown>, T>) => Fx<HKT2<F, B, unknown>, T>
export function useSome<F>(M: UseSome<F> & MonadRec<F>) {
  const lift = liftFx()
  const to = toMonad(M)

  return <A>(provided: A) => <B, R>(fx: Fx<HKT2<F, A & B, unknown>, R>) =>
    pipe(fx, to, (x) => M.useSome(provided)(x as any), lift)
}

export function provideSome<F extends URIS2>(
  M: ProvideSome2<F> & MonadRec2<F>,
): <A>(provided: A) => <B, T>(fx: Fx<Hkt<F, [A & B, unknown]>, T>) => Fx<Hkt<F, [B, unknown]>, T>
export function provideSome<F extends URIS3>(
  M: ProvideSome3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <B, E, T>(fx: Fx<Hkt<F, [A & B, E, unknown]>, T>) => Fx<Hkt<F, [B, E, unknown]>, T>
export function provideSome<F extends URIS4>(
  M: ProvideSome4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <B, S, E, T>(fx: Fx<Hkt<F, [S, A & B, E, unknown]>, T>) => Fx<Hkt<F, [S, B, E, unknown]>, T>
export function provideSome<F>(
  M: ProvideSome<F> & MonadRec<F>,
): <A>(provided: A) => <B, T>(fx: Fx<HKT2<F, A & B, unknown>, T>) => Fx<HKT2<F, B, unknown>, T>
export function provideSome<F>(M: ProvideSome<F> & MonadRec<F>) {
  const lift = liftFx()
  const to = toMonad(M)

  return <A>(provided: A) => <B, R>(fx: Fx<HKT2<F, A & B, unknown>, R>) =>
    pipe(fx, to, (x) => M.provideSome(provided)(x as any), lift)
}

export function useAll<F extends URIS2>(
  M: UseAll2<F> & MonadRec2<F>,
): <A>(provided: A) => <T>(fx: Fx<Hkt<F, [A, unknown]>, T>) => Fx<Hkt<F, [unknown, unknown]>, T>
export function useAll<F extends URIS3>(
  M: UseAll3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <E, T>(fx: Fx<Hkt<F, [A, E, unknown]>, T>) => Fx<Hkt<F, [unknown, E, unknown]>, T>
export function useAll<F extends URIS4>(
  M: UseAll4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <S, E, T>(fx: Fx<Hkt<F, [S, A, E, unknown]>, T>) => Fx<Hkt<F, [S, unknown, E, unknown]>, T>
export function useAll<F>(
  M: UseAll<F> & MonadRec<F>,
): <A>(provided: A) => <T>(fx: Fx<HKT2<F, A, unknown>, T>) => Fx<HKT2<F, unknown, unknown>, T>
export function useAll<F>(M: UseAll<F> & MonadRec<F>) {
  const lift = liftFx()
  const to = toMonad(M)

  return <A>(provided: A) => <R>(fx: Fx<HKT2<F, A, unknown>, R>) =>
    pipe(fx, to, (x) => M.useAll(provided)(x as any), lift)
}

export function provideAll<F extends URIS2>(
  M: ProvideAll2<F> & MonadRec2<F>,
): <A>(provided: A) => <T>(fx: Fx<Hkt<F, [A, unknown]>, T>) => Fx<Hkt<F, [unknown, unknown]>, T>
export function provideAll<F extends URIS3>(
  M: ProvideAll3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <E, T>(fx: Fx<Hkt<F, [A, E, unknown]>, T>) => Fx<Hkt<F, [unknown, E, unknown]>, T>
export function provideAll<F extends URIS4>(
  M: ProvideAll4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <S, E, T>(fx: Fx<Hkt<F, [S, A, E, unknown]>, T>) => Fx<Hkt<F, [S, unknown, E, unknown]>, T>
export function provideAll<F>(
  M: ProvideAll<F> & MonadRec<F>,
): <A>(provided: A) => <T>(fx: Fx<HKT2<F, A, unknown>, T>) => Fx<HKT2<F, unknown, unknown>, T>
export function provideAll<F>(M: ProvideAll<F> & MonadRec<F>) {
  const lift = liftFx()
  const to = toMonad(M)

  return <A>(provided: A) => <R>(fx: Fx<HKT2<F, A, unknown>, R>) =>
    pipe(fx, to, (x) => M.provideAll(provided)(x as any), lift)
}

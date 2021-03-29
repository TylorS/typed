import { pipe } from 'fp-ts/function'
import { Apply, Apply2, Apply3 } from 'fp-ts/Apply'
import { right, left, Either, match } from 'fp-ts/Either'
import { doFx, Fx } from './Fx'
import { ApplyVariance, Hkt } from './Hkt'
import { MonadRec1, MonadRec2, MonadRec2C, MonadRec3, MonadRec } from './MonadRec'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { Arity1 } from './function'

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

export type LiftFx2<F extends URIS2> = <E, A>(kind: Kind2<F, E, A>) => Fx<Kind2<F, E, A>, A>

export type LiftFx3<F extends URIS3> = <R, E, A>(
  kind: Kind3<F, R, E, A>,
) => Fx<Kind3<F, R, E, A>, A>

export type LiftFx4<F extends URIS4> = <S, R, E, A>(
  kind: Kind4<F, S, R, E, A>,
) => Fx<Kind4<F, S, R, E, A>, A>

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

export function toMonad<F extends URIS>(
  M: MonadRec1<F>,
): <E extends Kind<F, any>, R>(fx: Fx<E, R>) => Kind<F, R>

export function toMonad<F extends URIS2>(
  M: MonadRec2<F>,
): <E extends Kind2<F, S, any>, S, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonad<F extends URIS2, S>(
  M: MonadRec2C<F, S>,
): <E extends Kind2<F, S, any>, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonad<F extends URIS3>(
  M: MonadRec3<F>,
): <E extends Kind3<F, S, T, any>, S, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonad<F>(M: MonadRec<F>): <E extends Hkt<F, any>, R>(fx: Fx<E, R>) => HKT<F, R>

/**
 * Using a ChainRec instance we can create a stack-safe interpreter for do-notation
 * using Fx + generators.
 */
export function toMonad<F>(M: MonadRec<F>) {
  return function fxToMonad<E extends HKT<F, any>, R>(fx: Fx<E, R>): HKT<F, R> {
    const generator = fx[Symbol.iterator]()
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

export function ap<F extends URIS3>(
  M: MonadRec3<F> & Apply3<F>,
): <R1, E1, A>(
  fa: FxT<F, [R1, E1, A]>,
) => <R2, E2, B>(
  fab: FxT<F, [R2, E2, Arity1<A, B>]>,
) => FxT<F, [ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, B]>

export function ap<F extends URIS2>(
  M: MonadRec2<F> & Apply2<F>,
): <E1, A>(
  fa: FxT<F, [E1, A]>,
) => <E2, B>(fab: FxT<F, [E2, Arity1<A, B>]>) => FxT<F, [ApplyVariance<F, 'E', [E1, E2]>, B]>

export function ap<F extends URIS2, E>(
  M: MonadRec2<F> & Apply2<F>,
): <A>(fa: FxT<F, [E, A]>) => <B>(fab: FxT<F, [E, Arity1<A, B>]>) => FxT<F, [E, B]>

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
export function chainRec<F>(M: MonadRec<F>): ChainRecFxT<F> {
  return chainRec_(M) as ChainRecFxT<F>
}

export type ChainRecFxT<F> = F extends URIS2
  ? <A, E, B>(f: Arity1<A, FxT<F, [E, Either<A, B>]>>) => (a: A) => FxT<F, [E, B]>
  : F extends URIS3
  ? <A, R, E, B>(f: Arity1<A, FxT<F, [R, E, Either<A, B>]>>) => (a: A) => FxT<F, [R, E, B]>
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

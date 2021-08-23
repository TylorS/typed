import { Alt, Alt1, Alt2, Alt2C, Alt3, Alt3C, Alt4 } from 'fp-ts/Alt'
import * as Ap from 'fp-ts/Apply'
import {
  Bifunctor,
  Bifunctor2,
  Bifunctor2C,
  Bifunctor3,
  Bifunctor3C,
  Bifunctor4,
} from 'fp-ts/Bifunctor'
import { Chain, Chain1, Chain2, Chain3, Chain4 } from 'fp-ts/Chain'
import { Extend, Extend1, Extend2, Extend3, Extend4 } from 'fp-ts/Extend'
import { Foldable, Foldable1, Foldable2, Foldable3, Foldable4 } from 'fp-ts/Foldable'
import { pipe } from 'fp-ts/function'
import {
  Functor,
  Functor1,
  Functor2,
  Functor2C,
  Functor3,
  Functor3C,
  Functor4,
} from 'fp-ts/Functor'
import { HKT, HKT2, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { Monoid } from 'fp-ts/Monoid'

import { ApplyVariance } from './HKT'
import * as Ref from './Ref'
import * as ST from './struct'

export function map<F extends URIS4>(
  F: Functor4<F>,
): <A, B>(
  f: (a: A) => B,
) => <Q, I, S, R, E>(
  ref: Ref.Ref<Q, I, Kind4<F, S, R, E, A>>,
) => Ref.Ref<Q, I, Kind4<F, S, R, E, B>>

export function map<F extends URIS3>(
  F: Functor3<F>,
): <A, B>(
  f: (a: A) => B,
) => <Q, I, R, E>(ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>) => Ref.Ref<Q, I, Kind3<F, R, E, B>>

export function map<F extends URIS3, E>(
  F: Functor3C<F, E>,
): <A, B>(
  f: (a: A) => B,
) => <Q, I, R>(ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>) => Ref.Ref<Q, I, Kind3<F, R, E, B>>

export function map<F extends URIS2>(
  F: Functor2<F>,
): <A, B>(
  f: (a: A) => B,
) => <Q, I, E>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, Kind2<F, E, B>>

export function map<F extends URIS2, E>(
  F: Functor2C<F, E>,
): <A, B>(
  f: (a: A) => B,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, Kind2<F, E, B>>

export function map<F extends URIS>(
  F: Functor1<F>,
): <A, B>(f: (a: A) => B) => <E, I>(ref: Ref.Ref<E, I, Kind<F, A>>) => Ref.Ref<E, I, Kind<F, B>>

export function map<F>(
  F: Functor<F>,
): <A, B>(f: (a: A) => B) => <E, I>(ref: Ref.Ref<E, I, HKT<F, A>>) => Ref.Ref<E, I, HKT<F, B>>

export function map<F>(F: Functor<F>) {
  return <A, B>(f: (a: A) => B) =>
    <E, I>(ref: Ref.Ref<E, I, HKT<F, A>>): Ref.Ref<E, I, HKT<F, B>> =>
      pipe(ref, Ref.map(F.map(f)))
}

export function bimap<F extends URIS4>(
  F: Bifunctor4<F>,
): <A, B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D,
) => <Q, I, S, R>(ref: Ref.Ref<Q, I, Kind4<F, S, R, A, C>>) => Ref.Ref<Q, I, Kind4<F, S, R, B, D>>

export function bimap<F extends URIS3>(
  F: Bifunctor3<F>,
): <A, B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D,
) => <Q, I, R>(ref: Ref.Ref<Q, I, Kind3<F, R, A, C>>) => Ref.Ref<Q, I, Kind3<F, R, B, D>>

export function bimap<F extends URIS3, A>(
  F: Bifunctor3C<F, A>,
): <B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D,
) => <Q, I, R>(ref: Ref.Ref<Q, I, Kind3<F, R, A, C>>) => Ref.Ref<Q, I, Kind3<F, R, B, D>>

export function bimap<F extends URIS2>(
  F: Bifunctor2<F>,
): <A, B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D,
) => <E, I>(ref: Ref.Ref<E, I, Kind2<F, A, C>>) => Ref.Ref<E, I, Kind2<F, B, D>>

export function bimap<F extends URIS2, A>(
  F: Bifunctor2C<F, A>,
): <B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D,
) => <E, I>(ref: Ref.Ref<E, I, Kind2<F, A, C>>) => Ref.Ref<E, I, Kind2<F, B, D>>

export function bimap<F>(
  F: Bifunctor<F>,
): <A, B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D,
) => <E, I>(ref: Ref.Ref<E, I, HKT2<F, A, C>>) => Ref.Ref<E, I, HKT2<F, B, D>>

export function bimap<F>(F: Bifunctor<F>) {
  return <A, B, C, D>(f: (a: A) => B, g: (c: C) => D) =>
    <E, I>(ref: Ref.Ref<E, I, HKT2<F, A, C>>): Ref.Ref<E, I, HKT2<F, B, D>> =>
      pipe(ref, Ref.map(F.bimap(f, g)))
}

export function alt<F extends URIS4>(
  F: Alt4<F>,
): <S, R, E, A>(
  f: () => Kind4<F, S, R, E, A>,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind4<F, S, R, E, A>>) => Ref.Ref<Q, I, Kind4<F, S, R, E, A>>

export function alt<F extends URIS3>(
  F: Alt3<F>,
): <R, E, A>(
  f: () => Kind3<F, R, E, A>,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>) => Ref.Ref<Q, I, Kind3<F, R, E, A>>

export function alt<F extends URIS3, E>(
  F: Alt3C<F, E>,
): <R, A>(
  f: () => Kind3<F, R, E, A>,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>) => Ref.Ref<Q, I, Kind3<F, R, E, A>>

export function alt<F extends URIS2>(
  F: Alt2<F>,
): <E, A>(
  f: () => Kind2<F, E, A>,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, Kind2<F, E, A>>

export function alt<F extends URIS2, E>(
  F: Alt2C<F, E>,
): <A>(
  f: () => Kind2<F, E, A>,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, Kind2<F, E, A>>

export function alt<F extends URIS>(
  F: Alt1<F>,
): <A>(f: () => Kind<F, A>) => <Q, I>(ref: Ref.Ref<Q, I, Kind<F, A>>) => Ref.Ref<Q, I, Kind<F, A>>

export function alt<F>(
  F: Alt<F>,
): <A>(f: () => HKT<F, A>) => <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>) => Ref.Ref<Q, I, HKT<F, A>>

export function alt<F>(F: Alt<F>) {
  return <A>(f: () => HKT<F, A>) =>
    <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>) =>
      pipe(ref, Ref.map(F.alt(f)))
}

// TODO
export function ap<F extends URIS4>(
  F: Ap.Apply4<F>,
): <Q1, I1, S1, R1, E1, A>(
  fa: Ref.Ref<Q1, I1, Kind4<F, S1, R1, E1, A>>,
) => <Q2, I2, S2, R2, E2, B>(
  fab: Ref.Ref<Q2, I2, Kind4<F, S2, R2, E2, (a: A) => B>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind4<
    F,
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    B
  >
>

export function ap<F extends URIS3>(
  F: Ap.Apply3<F>,
): <Q1, I1, R1, E1, A>(
  fa: Ref.Ref<Q1, I1, Kind3<F, R1, E1, A>>,
) => <Q2, I2, R2, E2, B>(
  fab: Ref.Ref<Q2, I2, Kind3<F, R2, E2, (a: A) => B>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, B>
>

export function ap<F extends URIS2>(
  F: Ap.Apply2<F>,
): <Q1, I1, E1, A>(
  fa: Ref.Ref<Q1, I1, Kind2<F, E1, A>>,
) => <Q2, I2, E2, B>(
  fab: Ref.Ref<Q2, I2, Kind2<F, E2, (a: A) => B>>,
) => Ref.Ref<Q1 & Q2, I1 & I2, Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, B>>

export function ap<F extends URIS>(
  F: Ap.Apply1<F>,
): <Q1, I1, A>(
  fa: Ref.Ref<Q1, I1, Kind<F, A>>,
) => <Q2, I2, B>(
  fab: Ref.Ref<Q2, I2, Kind<F, (a: A) => B>>,
) => Ref.Ref<Q1 & Q2, I1 & I2, Kind<F, B>>

export function ap<F>(
  F: Ap.Apply<F>,
): <Q1, I1, A>(
  fa: Ref.Ref<Q1, I1, HKT<F, A>>,
) => <Q2, I2, B>(fab: Ref.Ref<Q2, I2, HKT<F, (a: A) => B>>) => Ref.Ref<Q1 & Q2, I1 & I2, HKT<F, B>>

export function ap<F>(F: Ap.Apply<F>) {
  return <Q1, I1, A>(fa: Ref.Ref<Q1, I1, HKT<F, A>>) =>
    <Q2, I2, B>(fab: Ref.Ref<Q2, I2, HKT<F, (a: A) => B>>): Ref.Ref<Q1 & Q2, I1 & I2, HKT<F, B>> =>
      pipe(
        Ref.struct({
          fa,
          fab,
        }),
        Ref.promap(
          (env) => ({ fa: env, fab: env }),
          ({ fa, fab }) => F.ap(fa)(fab),
        ),
      )
}

export function bindTo<F extends URIS4>(
  F: Functor4<F>,
): <K extends string>(
  name: K,
) => <Q, I, S, R, E, A>(
  ref: Ref.Ref<Q, I, Kind4<F, S, R, E, A>>,
) => Ref.Ref<Q, I, Kind4<F, S, R, E, { readonly [_ in K]: A }>>

export function bindTo<F extends URIS3>(
  F: Functor3<F>,
): <K extends string>(
  name: K,
) => <Q, I, R, E, A>(
  ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>,
) => Ref.Ref<Q, I, Kind3<F, R, E, { readonly [_ in K]: A }>>

export function bindTo<F extends URIS2>(
  F: Functor2<F>,
): <K extends string>(
  name: K,
) => <Q, I, E, A>(
  ref: Ref.Ref<Q, I, Kind2<F, E, A>>,
) => Ref.Ref<Q, I, Kind2<F, E, { readonly [_ in K]: A }>>

export function bindTo<F extends URIS>(
  F: Functor1<F>,
): <K extends string>(
  name: K,
) => <R, I, O>(ref: Ref.Ref<R, I, Kind<F, O>>) => Ref.Ref<R, I, Kind<F, { readonly [_ in K]: O }>>

export function bindTo<F>(
  F: Functor<F>,
): <K extends string>(
  name: K,
) => <R, I, O>(ref: Ref.Ref<R, I, HKT<F, O>>) => Ref.Ref<R, I, HKT<F, { readonly [_ in K]: O }>>

export function bindTo<F>(F: Functor<F>) {
  return <K extends string>(name: K) =>
    <R, I, O>(ref: Ref.Ref<R, I, HKT<F, O>>): Ref.Ref<R, I, HKT<F, { readonly [_ in K]: O }>> =>
      pipe(ref, Ref.map(F.map((o) => ST.make(name, o))))
}

export function apS<F extends URIS4>(
  F: Ap.Apply4<F>,
): <N extends string, A, Q1, I1, S1, R1, E1, B>(
  name: Exclude<N, keyof A>,
  fb: Ref.Ref<Q1, I1, Kind4<F, S1, R1, E1, B>>,
) => <Q2, I2, S2, R2, E2>(
  fa: Ref.Ref<Q2, I2, Kind4<F, S2, R2, E2, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind4<
    F,
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    {
      readonly [K in keyof A | N]: K extends keyof A ? A[K] : B
    }
  >
>

export function apS<F extends URIS3>(
  F: Ap.Apply3<F>,
): <N extends string, A, Q1, I1, R1, E1, B>(
  name: Exclude<N, keyof A>,
  fb: Ref.Ref<Q1, I1, Kind3<F, R1, E1, B>>,
) => <Q2, I2, R2, E2>(
  fa: Ref.Ref<Q2, I2, Kind3<F, R2, E2, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind3<
    F,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    {
      readonly [K in keyof A | N]: K extends keyof A ? A[K] : B
    }
  >
>

export function apS<F extends URIS2>(
  F: Ap.Apply2<F>,
): <N extends string, A, Q1, I1, E1, B>(
  name: Exclude<N, keyof A>,
  fb: Ref.Ref<Q1, I1, Kind2<F, E1, B>>,
) => <Q2, I2, E2>(
  fa: Ref.Ref<Q2, I2, Kind2<F, E2, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind2<
    F,
    ApplyVariance<F, 'E', [E1, E2]>,
    {
      readonly [K in keyof A | N]: K extends keyof A ? A[K] : B
    }
  >
>

export function apS<F extends URIS>(
  F: Ap.Apply1<F>,
): <N extends string, A, Q1, I1, B>(
  name: Exclude<N, keyof A>,
  fb: Ref.Ref<Q1, I1, Kind<F, B>>,
) => <Q2, I2>(
  fa: Ref.Ref<Q2, I2, Kind<F, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind<
    F,
    {
      readonly [K in keyof A | N]: K extends keyof A ? A[K] : B
    }
  >
>

export function apS<F>(F: Ap.Apply<F>): <N extends string, A, Q1, I1, B>(
  name: Exclude<N, keyof A>,
  fb: Ref.Ref<Q1, I1, HKT<F, B>>,
) => <Q2, I2>(
  fa: Ref.Ref<Q2, I2, HKT<F, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  HKT<
    F,
    {
      readonly [K in keyof A | N]: K extends keyof A ? A[K] : B
    }
  >
>

export function apS<F>(F: Ap.Apply<F>) {
  const apS = Ap.apS(F)

  return <N extends string, A, Q1, I1, B>(
      name: Exclude<N, keyof A>,
      fb: Ref.Ref<Q1, I1, HKT<F, B>>,
    ) =>
    <Q2, I2>(
      fa: Ref.Ref<Q2, I2, HKT<F, A>>,
    ): Ref.Ref<
      Q1 & Q2,
      I1 & I2,
      HKT<
        F,
        {
          readonly [K in keyof A | N]: K extends keyof A ? A[K] : B
        }
      >
    > =>
      pipe(
        Ref.struct({ fa, fb }),
        Ref.promap(
          (input: I1 & I2) => ({ fa: input, fb: input }),
          ({ fa, fb }) => pipe(fa, apS(name, fb)),
        ),
      )
}

export function apT<F extends URIS4>(
  F: Ap.Apply4<F>,
): <Q1, I1, S1, R1, E1, B>(
  fb: Ref.Ref<Q1, I1, Kind4<F, S1, R1, E1, B>>,
) => <Q2, I2, S2, R2, E2, A extends readonly unknown[]>(
  fa: Ref.Ref<Q2, I2, Kind4<F, S2, R2, E2, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind4<
    F,
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    readonly [...A, B]
  >
>

export function apT<F extends URIS3>(
  F: Ap.Apply3<F>,
): <Q1, I1, R1, E1, B>(
  fb: Ref.Ref<Q1, I1, Kind3<F, R1, E1, B>>,
) => <Q2, I2, R2, E2, A extends readonly unknown[]>(
  fa: Ref.Ref<Q2, I2, Kind3<F, R2, E2, A>>,
) => Ref.Ref<
  Q1 & Q2,
  I1 & I2,
  Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, readonly [...A, B]>
>

export function apT<F extends URIS2>(
  F: Ap.Apply2<F>,
): <Q1, I1, E1, B>(
  fb: Ref.Ref<Q1, I1, Kind2<F, E1, B>>,
) => <Q2, I2, E2, A extends readonly unknown[]>(
  fa: Ref.Ref<Q2, I2, Kind2<F, E2, A>>,
) => Ref.Ref<Q1 & Q2, I1 & I2, Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, readonly [...A, B]>>

export function apT<F extends URIS>(
  F: Ap.Apply1<F>,
): <Q1, I1, B>(
  fb: Ref.Ref<Q1, I1, Kind<F, B>>,
) => <Q2, I2, A extends readonly unknown[]>(
  fa: Ref.Ref<Q2, I2, Kind<F, A>>,
) => Ref.Ref<Q1 & Q2, I1 & I2, Kind<F, readonly [...A, B]>>

export function apT<F>(
  F: Ap.Apply<F>,
): <Q1, I1, B>(
  fb: Ref.Ref<Q1, I1, HKT<F, B>>,
) => <Q2, I2, A extends readonly unknown[]>(
  fa: Ref.Ref<Q2, I2, HKT<F, A>>,
) => Ref.Ref<Q1 & Q2, I1 & I2, HKT<F, readonly [...A, B]>>

export function apT<F>(F: Ap.Apply<F>) {
  const apT = Ap.apT(F)

  return <Q1, I1, B>(fb: Ref.Ref<Q1, I1, HKT<F, B>>) =>
    <Q2, I2, A extends readonly unknown[]>(
      fa: Ref.Ref<Q2, I2, HKT<F, A>>,
    ): Ref.Ref<Q1 & Q2, I1 & I2, HKT<F, readonly [...A, B]>> =>
      pipe(
        Ref.struct({ fa, fb }),
        Ref.promap(
          (input: I1 & I2) => ({ fa: input, fb: input }),
          ({ fa, fb }) => pipe(fa, apT(fb)),
        ),
      )
}

export function tupled<F extends URIS4>(
  F: Functor4<F>,
): <Q, I, S, R, E, A>(
  ref: Ref.Ref<Q, I, Kind4<F, S, R, E, A>>,
) => Ref.Ref<Q, I, Kind4<F, S, R, E, readonly [A]>>
export function tupled<F extends URIS3>(
  F: Functor3<F>,
): <Q, I, R, E, A>(
  ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>,
) => Ref.Ref<Q, I, Kind3<F, R, E, readonly [A]>>
export function tupled<F extends URIS2>(
  F: Functor2<F>,
): <Q, I, E, A>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, Kind2<F, E, readonly [A]>>
export function tupled<F extends URIS>(
  F: Functor1<F>,
): <Q, I, A>(ref: Ref.Ref<Q, I, Kind<F, A>>) => Ref.Ref<Q, I, Kind<F, readonly [A]>>
export function tupled<F>(
  F: Functor<F>,
): <Q, I, A>(ref: Ref.Ref<Q, I, HKT<F, A>>) => Ref.Ref<Q, I, HKT<F, readonly [A]>>

export function tupled<F>(F: Functor<F>) {
  return <Q, I, A>(ref: Ref.Ref<Q, I, HKT<F, A>>): Ref.Ref<Q, I, HKT<F, readonly [A]>> =>
    pipe(ref, Ref.map(F.map((o) => [o])))
}

export function chain<F extends URIS4>(
  F: Chain4<F>,
): <A, S1, R1, E1, B>(
  f: (a: A) => Kind4<F, S1, R1, E1, B>,
) => <Q, I, S2, R2, E2>(
  ref: Ref.Ref<Q, I, Kind4<F, S2, R2, E2, A>>,
) => Ref.Ref<
  Q,
  I,
  Kind4<
    F,
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    B
  >
>

export function chain<F extends URIS3>(
  F: Chain3<F>,
): <A, R1, E1, B>(
  f: (a: A) => Kind3<F, R1, E1, B>,
) => <Q, I, R2, E2>(
  ref: Ref.Ref<Q, I, Kind3<F, R2, E2, A>>,
) => Ref.Ref<Q, I, Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, B>>

export function chain<F extends URIS2>(
  F: Chain2<F>,
): <A, E1, B>(
  f: (a: A) => Kind2<F, E1, B>,
) => <Q, I, E2>(
  ref: Ref.Ref<Q, I, Kind2<F, E2, A>>,
) => Ref.Ref<Q, I, Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, B>>

export function chain<F extends URIS>(
  F: Chain1<F>,
): <A, B>(
  f: (a: A) => Kind<F, B>,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind<F, A>>) => Ref.Ref<Q, I, Kind<F, B>>

export function chain<F>(
  F: Chain<F>,
): <A, B>(
  f: (a: A) => HKT<F, B>,
) => <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>) => Ref.Ref<Q, I, HKT<F, B>>

export function chain<F>(F: Chain<F>) {
  return <A, B>(f: (a: A) => HKT<F, B>) =>
    <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>): Ref.Ref<Q, I, HKT<F, B>> =>
      pipe(ref, Ref.map(F.chain(f)))
}

export function extend<F extends URIS4>(
  F: Extend4<F>,
): <S, R, E, A, B>(
  f: (hkt: Kind4<F, S, R, E, A>) => B,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind4<F, S, R, E, A>>) => Ref.Ref<Q, I, Kind4<F, S, R, E, B>>

export function extend<F extends URIS3>(
  F: Extend3<F>,
): <R, E, A, B>(
  f: (hkt: Kind3<F, R, E, A>) => B,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>) => Ref.Ref<Q, I, Kind3<F, R, E, B>>

export function extend<F extends URIS2>(
  F: Extend2<F>,
): <E, A, B>(
  f: (hkt: Kind2<F, E, A>) => B,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, Kind2<F, E, B>>

export function extend<F extends URIS>(
  F: Extend1<F>,
): <A, B>(
  f: (hkt: Kind<F, A>) => B,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind<F, A>>) => Ref.Ref<Q, I, Kind<F, B>>

export function extend<F>(
  F: Extend<F>,
): <A, B>(
  f: (hkt: HKT<F, A>) => B,
) => <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>) => Ref.Ref<Q, I, HKT<F, B>>

export function extend<F>(F: Extend<F>) {
  return <A, B>(f: (hkt: HKT<F, A>) => B) =>
    <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>): Ref.Ref<Q, I, HKT<F, B>> =>
      pipe(ref, Ref.map(F.extend(f)))
}

export function reduce<F extends URIS4>(
  F: Foldable4<F>,
): <A, B>(
  seed: A,
  f: (acc: A, value: B) => A,
) => <Q, I, S, R, E>(ref: Ref.Ref<Q, I, Kind4<F, S, R, E, B>>) => Ref.Ref<Q, I, A>

export function reduce<F extends URIS3>(
  F: Foldable3<F>,
): <A, B>(
  seed: A,
  f: (acc: A, value: B) => A,
) => <Q, I, R, E>(ref: Ref.Ref<Q, I, Kind3<F, R, E, B>>) => Ref.Ref<Q, I, A>

export function reduce<F extends URIS2>(
  F: Foldable2<F>,
): <A, B>(
  seed: A,
  f: (acc: A, value: B) => A,
) => <Q, I, E>(ref: Ref.Ref<Q, I, Kind2<F, E, B>>) => Ref.Ref<Q, I, A>

export function reduce<F extends URIS>(
  F: Foldable1<F>,
): <A, B>(
  seed: A,
  f: (acc: A, value: B) => A,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind<F, B>>) => Ref.Ref<Q, I, A>

export function reduce<F>(
  F: Foldable<F>,
): <A, B>(
  seed: A,
  f: (acc: A, value: B) => A,
) => <Q, I>(ref: Ref.Ref<Q, I, HKT<F, B>>) => Ref.Ref<Q, I, A>

export function reduce<F>(F: Foldable<F>) {
  return <A, B>(seed: A, f: (acc: A, value: B) => A) =>
    <Q, I>(ref: Ref.Ref<Q, I, HKT<F, B>>) =>
      pipe(ref, Ref.map(F.reduce(seed, f)))
}

export function reduceRight<F extends URIS4>(
  F: Foldable4<F>,
): <A, B>(
  seed: A,
  f: (value: B, acc: A) => A,
) => <Q, I, S, R, E>(ref: Ref.Ref<Q, I, Kind4<F, S, R, E, B>>) => Ref.Ref<Q, I, A>

export function reduceRight<F extends URIS3>(
  F: Foldable3<F>,
): <A, B>(
  seed: A,
  f: (value: B, acc: A) => A,
) => <Q, I, R, E>(ref: Ref.Ref<Q, I, Kind3<F, R, E, B>>) => Ref.Ref<Q, I, A>

export function reduceRight<F extends URIS2>(
  F: Foldable2<F>,
): <A, B>(
  seed: A,
  f: (value: B, acc: A) => A,
) => <Q, I, E>(ref: Ref.Ref<Q, I, Kind2<F, E, B>>) => Ref.Ref<Q, I, A>

export function reduceRight<F extends URIS>(
  F: Foldable1<F>,
): <A, B>(
  seed: A,
  f: (value: B, acc: A) => A,
) => <Q, I>(ref: Ref.Ref<Q, I, Kind<F, B>>) => Ref.Ref<Q, I, A>

export function reduceRight<F>(
  F: Foldable<F>,
): <A, B>(
  seed: A,
  f: (value: B, acc: A) => A,
) => <Q, I>(ref: Ref.Ref<Q, I, HKT<F, B>>) => Ref.Ref<Q, I, A>

export function reduceRight<F>(F: Foldable<F>) {
  return <A, B>(seed: A, f: (value: B, acc: A) => A) =>
    <Q, I>(ref: Ref.Ref<Q, I, HKT<F, B>>) =>
      pipe(ref, Ref.map(F.reduceRight(seed, f)))
}

export function foldMap<F extends URIS4>(
  F: Foldable4<F>,
): <M>(
  M: Monoid<M>,
) => <A>(
  f: (a: A) => M,
) => <Q, I, S, R, E>(ref: Ref.Ref<Q, I, Kind4<F, S, R, E, A>>) => Ref.Ref<Q, I, M>

export function foldMap<F extends URIS3>(
  F: Foldable3<F>,
): <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => <Q, I, R, E>(ref: Ref.Ref<Q, I, Kind3<F, R, E, A>>) => Ref.Ref<Q, I, M>

export function foldMap<F extends URIS2>(
  F: Foldable2<F>,
): <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => <Q, I, E>(ref: Ref.Ref<Q, I, Kind2<F, E, A>>) => Ref.Ref<Q, I, M>

export function foldMap<F extends URIS>(
  F: Foldable1<F>,
): <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => <Q, I>(ref: Ref.Ref<Q, I, Kind<F, A>>) => Ref.Ref<Q, I, M>

export function foldMap<F>(
  F: Foldable<F>,
): <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>) => Ref.Ref<Q, I, M>

export function foldMap<F>(F: Foldable<F>) {
  return <M>(M: Monoid<M>) => {
    const fold_ = F.foldMap(M)

    return <A>(f: (a: A) => M) =>
      <Q, I>(ref: Ref.Ref<Q, I, HKT<F, A>>) =>
        pipe(ref, Ref.map(fold_(f)))
  }
}

/**
 * Provide is a Typeclass to represent the ability to add/remove requirements from Reader-like
 * effects such as [Env](./Env.ts.md) or [ReaderStream](./ReaderStream.ts.md).
 *
 * @since 0.9.2
 */
import { Chain, Chain2, Chain3, Chain4 } from 'fp-ts/Chain'
import { FromReader, FromReader2, FromReader3, FromReader4 } from 'fp-ts/FromReader'
import { pipe } from 'fp-ts/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'

import { ApplyVariance, Hkt } from './HKT'

/**
 * Type-class for providing some or all of the requirements.
 */
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface Provide<F> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: HKT2<F, A & B, C>) => HKT2<F, B, C>
  readonly provideAll: <A>(provided: A) => <B>(hkt: HKT2<F, Partial<A>, B>) => HKT2<F, unknown, B>
  readonly useSome: Provide<F>['provideSome']
  readonly useAll: Provide<F>['provideAll']
}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideSome<F> extends Pick<Provide<F>, 'provideSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideAll<F> extends Pick<Provide<F>, 'provideAll'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseSome<F> extends Pick<Provide<F>, 'useSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseAll<F> extends Pick<Provide<F>, 'useAll'> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface Provide2<F extends URIS2> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: Hkt<F, [A & B, C]>) => Hkt<F, [B, C]>
  readonly provideAll: <A>(provided: A) => <B>(hkt: Hkt<F, [Partial<A>, B]>) => Hkt<F, [unknown, B]>
  readonly useSome: Provide2<F>['provideSome']
  readonly useAll: Provide2<F>['provideAll']
}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideSome2<F extends URIS2> extends Pick<Provide2<F>, 'provideSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideAll2<F extends URIS2> extends Pick<Provide2<F>, 'provideAll'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseSome2<F extends URIS2> extends Pick<Provide2<F>, 'useSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseAll2<F extends URIS2> extends Pick<Provide2<F>, 'useAll'> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface Provide3<F extends URIS3> {
  readonly provideSome: <A>(
    provided: A,
  ) => <B, E, C>(hkt: Hkt<F, [A & B, E, C]>) => Hkt<F, [B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <E, B>(hkt: Hkt<F, [Partial<A>, E, B]>) => Hkt<F, [unknown, E, B]>
  readonly useSome: Provide3<F>['provideSome']
  readonly useAll: Provide3<F>['provideAll']
}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideSome3<F extends URIS3> extends Pick<Provide3<F>, 'provideSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideAll3<F extends URIS3> extends Pick<Provide3<F>, 'provideAll'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseSome3<F extends URIS3> extends Pick<Provide3<F>, 'useSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseAll3<F extends URIS3> extends Pick<Provide3<F>, 'useAll'> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface Provide3C<F extends URIS3, E> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: Hkt<F, [A & B, E, C]>) => Hkt<F, [B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <B>(hkt: Hkt<F, [Partial<A>, E, B]>) => Hkt<F, [unknown, E, B]>
  readonly useSome: Provide3C<F, E>['provideSome']
  readonly useAll: Provide3C<F, E>['provideAll']
}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideSome3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'provideSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideAll3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'provideAll'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseSome3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'useSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseAll3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'useAll'> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface Provide4<F extends URIS4> {
  readonly provideSome: <A>(
    provided: A,
  ) => <S, B, E, C>(hkt: Hkt<F, [S, A & B, E, C]>) => Hkt<F, [S, B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <S, E, B>(hkt: Hkt<F, [S, Partial<A>, E, B]>) => Hkt<F, [S, unknown, E, B]>
  readonly useSome: Provide4<F>['provideSome']
  readonly useAll: Provide4<F>['provideAll']
}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideSome4<F extends URIS4> extends Pick<Provide4<F>, 'provideSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface ProvideAll4<F extends URIS4> extends Pick<Provide4<F>, 'provideAll'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseSome4<F extends URIS4> extends Pick<Provide4<F>, 'useSome'> {}
/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface UseAll4<F extends URIS4> extends Pick<Provide4<F>, 'useAll'> {}

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Provider<F, Removed, Added> = <E, A>(
  hkt: Hkt<F, [Removed & E, A]>,
) => Hkt<F, [Added & E, A]>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Provider2<F extends URIS2, Removed, Added> = <E, A>(
  hkt: Hkt<F, [Removed & E, A]>,
) => Hkt<F, [Added & E, A]>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Provider3<F extends URIS3, Removed, Added, E1> = <R, E2, A>(
  hkt: Hkt<F, [Removed & R, E2, A]>,
) => Hkt<F, [Added & R, ApplyVariance<F, 'E', [E1, E2]>, A]>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Provider4<F extends URIS4, Removed, Added, S1, E1> = <S2, R, E2, A>(
  hkt: Hkt<F, [S2, Removed & R, E2, A]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, Added & R, ApplyVariance<F, 'E', [E1, E2]>, A]>

/**
 * @since 0.9.2
 * @category Combinator
 */
export function useSomeWith<F extends URIS2>(
  M: UseSome2<F> & Chain2<F>,
): <E1, A>(provider: Hkt<F, [E1, A]>) => Provider2<F, A, E1>

export function useSomeWith<F extends URIS3>(
  M: UseSome3<F> & Chain3<F>,
): <R1, E1, A>(provider: Hkt<F, [R1, E1, A]>) => Provider3<F, A, R1, E1>

export function useSomeWith<F extends URIS4>(
  M: UseSome4<F> & Chain4<F>,
): <S1, R1, E1, A>(provider: Hkt<F, [S1, R1, E1, A]>) => Provider4<F, A, R1, S1, E1>

export function useSomeWith<F>(
  M: UseSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, A, E1>

export function useSomeWith<F>(M: UseSome<F> & Chain<F>) {
  return <E1, A>(provider: HKT2<F, E1, A>) =>
    <E2, B>(hkt: HKT2<F, A & E2, B>) =>
      pipe(
        provider,
        M.chain((removed) => pipe(hkt, M.useSome(removed))),
      )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function provideSomeWith<F extends URIS2>(
  M: ProvideSome2<F> & Chain2<F>,
): <E1, A>(provider: Hkt<F, [E1, A]>) => Provider2<F, A, E1>

export function provideSomeWith<F extends URIS3>(
  M: ProvideSome3<F> & Chain3<F>,
): <R1, E1, A>(provider: Hkt<F, [R1, E1, A]>) => Provider3<F, A, R1, E1>

export function provideSomeWith<F extends URIS4>(
  M: ProvideSome4<F> & Chain4<F>,
): <S1, R1, E1, A>(provider: Hkt<F, [S1, R1, E1, A]>) => Provider4<F, A, R1, S1, E1>

export function provideSomeWith<F>(
  M: ProvideSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, A, E1>

export function provideSomeWith<F>(M: ProvideSome<F> & Chain<F>) {
  return <E1, A>(provider: HKT2<F, E1, A>) =>
    <E2, B>(hkt: HKT2<F, A & E2, B>) =>
      pipe(
        provider,
        M.chain((removed) => pipe(hkt, M.provideSome(removed))),
      )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function useAllWith<F extends URIS2>(
  M: UseAll2<F> & Chain2<F>,
): <R, A>(provider: Hkt<F, [R, A]>) => <B>(hkt: Hkt<F, [A, B]>) => Hkt<F, [R, B]>

export function useAllWith<F extends URIS3>(
  M: UseAll3<F> & Chain3<F>,
): <R, E1, A>(
  provider: Hkt<F, [R, E1, A]>,
) => <E2, B>(hkt: Hkt<F, [A, E2, B]>) => Hkt<F, [R, ApplyVariance<F, 'E', [E1, E2]>, B]>

export function useAllWith<F extends URIS4>(
  M: UseAll4<F> & Chain4<F>,
): <S1, R, E1, A>(
  provider: Hkt<F, [S1, R, E1, A]>,
) => <S2, E2, B>(
  hkt: Hkt<F, [S2, A, E2, B]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, R, ApplyVariance<F, 'E', [E1, E2]>, B]>

export function useAllWith<F>(
  M: UseAll<F> & Chain<F>,
): <R, A>(provider: HKT2<F, R, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, R, B>

export function useAllWith<F>(M: UseAll<F> & Chain<F>) {
  return <R, A>(provider: HKT2<F, R, A>) =>
    <B>(hkt: HKT2<F, A, B>) =>
      pipe(
        provider,
        M.chain((removed) => pipe(hkt, M.useAll(removed))),
      )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function provideAllWith<F extends URIS2>(
  M: ProvideAll2<F> & Chain2<F>,
): <R, A>(provider: Hkt<F, [R, A]>) => <B>(hkt: Hkt<F, [A, B]>) => Hkt<F, [R, B]>

export function provideAllWith<F extends URIS3>(
  M: ProvideAll3<F> & Chain3<F>,
): <R, E1, A>(
  provider: Hkt<F, [R, E1, A]>,
) => <E2, B>(hkt: Hkt<F, [A, E2, B]>) => Hkt<F, [R, ApplyVariance<F, 'E', [E1, E2]>, B]>

export function provideAllWith<F extends URIS4>(
  M: ProvideAll4<F> & Chain4<F>,
): <S1, R, E1, A>(
  provider: Hkt<F, [S1, R, E1, A]>,
) => <S2, E2, B>(
  hkt: Hkt<F, [S2, A, E2, B]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, R, ApplyVariance<F, 'E', [E1, E2]>, B]>

export function provideAllWith<F>(
  M: ProvideAll<F> & Chain<F>,
): <R, A>(provider: HKT2<F, R, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, R, B>

export function provideAllWith<F>(M: ProvideAll<F> & Chain<F>) {
  return <R, A>(provider: HKT2<F, R, A>) =>
    <B>(hkt: HKT2<F, A, B>) =>
      pipe(
        provider,
        M.chain((removed) => pipe(hkt, M.provideAll(removed))),
      )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function askAndUse<F extends URIS2>(
  M: UseAll2<F> & Chain2<F> & FromReader2<F>,
): <E, B>(hkt: Kind2<F, E, B>) => Kind2<F, E, Kind2<F, unknown, B>>

export function askAndUse<F extends URIS3>(
  M: UseAll3<F> & Chain3<F> & FromReader3<F>,
): <R, E, B>(hkt: Kind3<F, R, E, B>) => Kind3<F, R, E, Kind3<F, unknown, E, B>>

export function askAndUse<F extends URIS4>(
  M: UseAll4<F> & Chain4<F> & FromReader4<F>,
): <S, R, E, B>(hkt: Kind4<F, S, R, E, B>) => Kind4<F, S, R, E, Kind4<F, S, unknown, E, B>>

export function askAndUse<F>(
  M: UseAll<F> & Chain<F> & FromReader<F>,
): <E, B>(hkt: HKT2<F, E, B>) => HKT2<F, E, HKT2<F, unknown, B>>

export function askAndUse<F>(M: UseAll<F> & Chain<F> & FromReader<F>) {
  return <E, B>(hkt: HKT2<F, E, B>) =>
    pipe(
      M.fromReader((e: E) => e),
      M.map((e) => pipe(hkt, M.useAll(e))),
    )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function askAndProvide<F extends URIS2>(
  M: ProvideAll2<F> & Chain2<F> & FromReader2<F>,
): <E, B>(hkt: Kind2<F, E, B>) => Kind2<F, E, Kind2<F, unknown, B>>

export function askAndProvide<F extends URIS3>(
  M: ProvideAll3<F> & Chain3<F> & FromReader3<F>,
): <R, E, B>(hkt: Kind3<F, R, E, B>) => Kind3<F, R, E, Kind3<F, unknown, E, B>>

export function askAndProvide<F extends URIS4>(
  M: ProvideAll4<F> & Chain4<F> & FromReader4<F>,
): <S, R, E, B>(hkt: Kind4<F, S, R, E, B>) => Kind4<F, S, R, E, Kind4<F, S, unknown, E, B>>

export function askAndProvide<F>(
  M: ProvideAll<F> & Chain<F> & FromReader<F>,
): <E, B>(hkt: HKT2<F, E, B>) => HKT2<F, E, HKT2<F, unknown, B>>

export function askAndProvide<F>(M: ProvideAll<F> & Chain<F> & FromReader<F>) {
  return <E, B>(hkt: HKT2<F, E, B>) =>
    pipe(
      M.fromReader((e: E) => e),
      M.map((e) => pipe(hkt, M.provideAll(e))),
    )
}

import { Chain, Chain2, Chain3, Chain4 } from 'fp-ts/Chain'
import { pipe } from 'fp-ts/function'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'

import { ApplyVariance, Hkt } from './Hkt'

/**
 * Type-class for providing some or all of the requirements.
 */
export interface Provide<F> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: HKT2<F, A & B, C>) => HKT2<F, B, C>
  readonly provideAll: <A>(provided: A) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, never, B>
  readonly useSome: Provide<F>['provideSome']
  readonly useAll: Provide<F>['provideAll']
}

export interface ProvideSome<F> extends Pick<Provide<F>, 'provideSome'> {}
export interface ProvideAll<F> extends Pick<Provide<F>, 'provideAll'> {}
export interface UseSome<F> extends Pick<Provide<F>, 'useSome'> {}
export interface UseAll<F> extends Pick<Provide<F>, 'useAll'> {}

export interface Provide2<F extends URIS2> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: Hkt<F, [A & B, C]>) => Hkt<F, [B, C]>
  readonly provideAll: <A>(provided: A) => <B>(hkt: Hkt<F, [A, B]>) => Hkt<F, [never, B]>
  readonly useSome: Provide2<F>['provideSome']
  readonly useAll: Provide2<F>['provideAll']
}

export interface ProvideSome2<F extends URIS2> extends Pick<Provide2<F>, 'provideSome'> {}
export interface ProvideAll2<F extends URIS2> extends Pick<Provide2<F>, 'provideAll'> {}
export interface UseSome2<F extends URIS2> extends Pick<Provide2<F>, 'useSome'> {}
export interface UseAll2<F extends URIS2> extends Pick<Provide2<F>, 'useAll'> {}

export interface Provide3<F extends URIS3> {
  readonly provideSome: <A>(
    provided: A,
  ) => <B, E, C>(hkt: Hkt<F, [A & B, E, C]>) => Hkt<F, [B, E, C]>
  readonly provideAll: <A>(provided: A) => <E, B>(hkt: Hkt<F, [A, E, B]>) => Hkt<F, [never, E, B]>
  readonly useSome: Provide3<F>['provideSome']
  readonly useAll: Provide3<F>['provideAll']
}

export interface ProvideSome3<F extends URIS3> extends Pick<Provide3<F>, 'provideSome'> {}
export interface ProvideAll3<F extends URIS3> extends Pick<Provide3<F>, 'provideAll'> {}
export interface UseSome3<F extends URIS3> extends Pick<Provide3<F>, 'useSome'> {}
export interface UseAll3<F extends URIS3> extends Pick<Provide3<F>, 'useAll'> {}

export interface Provide3C<F extends URIS3, E> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: Hkt<F, [A & B, E, C]>) => Hkt<F, [B, E, C]>
  readonly provideAll: <A>(provided: A) => <B>(hkt: Hkt<F, [A, E, B]>) => Hkt<F, [never, E, B]>
  readonly useSome: Provide3C<F, E>['provideSome']
  readonly useAll: Provide3C<F, E>['provideAll']
}

export interface ProvideSome3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'provideSome'> {}
export interface ProvideAll3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'provideAll'> {}
export interface UseSome3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'useSome'> {}
export interface UseAll3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'useAll'> {}

export interface Provide4<F extends URIS4> {
  readonly provideSome: <A>(
    provided: A,
  ) => <S, B, E, C>(hkt: Hkt<F, [S, A & B, E, C]>) => Hkt<F, [S, B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <S, E, B>(hkt: Hkt<F, [S, A, E, B]>) => Hkt<F, [S, never, E, B]>
  readonly useSome: Provide3<F>['provideSome']
  readonly useAll: Provide3<F>['provideAll']
}

export interface ProvideSome4<F extends URIS4> extends Pick<Provide4<F>, 'provideSome'> {}
export interface ProvideAll4<F extends URIS4> extends Pick<Provide4<F>, 'provideAll'> {}
export interface UseSome4<F extends URIS4> extends Pick<Provide4<F>, 'useSome'> {}
export interface UseAll4<F extends URIS4> extends Pick<Provide4<F>, 'useAll'> {}

export type Provider<F, Removed, Added> = <E, A>(
  hkt: Hkt<F, [Removed & E, A]>,
) => Hkt<F, [Added & E, A]>

export type Provider2<F extends URIS2, Removed, Added> = <E, A>(
  hkt: Hkt<F, [Removed & E, A]>,
) => Hkt<F, [Added & E, A]>

export type Provider3<F extends URIS3, Removed, Added, E1> = <R, E2, A>(
  hkt: Hkt<F, [Removed & R, E2, A]>,
) => Hkt<F, [Added & R, ApplyVariance<F, 'E', [E1, E2]>, A]>

export type Provider4<F extends URIS4, Removed, Added, S1, E1> = <S2, R, E2, A>(
  hkt: Hkt<F, [S2, Removed & R, E2, A]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, Added & R, ApplyVariance<F, 'E', [E1, E2]>, A]>

export function useSomeWith<F extends URIS2>(
  M: UseSome2<F> & Chain2<F>,
): <E1, A>(provider: Hkt<F, [E1, A]>) => Provider2<F, A, E1>

export function useSomeWith<F extends URIS3>(
  M: UseSome3<F> & Chain3<F>,
): <R1, E1, A>(provider: Hkt<F, [R1, E1, A]>) => Provider3<F, A, R1, E1>

export function useSomeWith<F extends URIS4>(
  M: UseSome3<F> & Chain3<F>,
): <S1, R1, E1, A>(provider: Hkt<F, [S1, R1, E1, A]>) => Provider4<F, A, R1, S1, E1>

export function useSomeWith<F>(
  M: UseSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, A, E1>

export function useSomeWith<F>(M: UseSome<F> & Chain<F>) {
  return <E1, A>(provider: HKT2<F, E1, A>) => <E2, B>(hkt: HKT2<F, A & E2, B>) =>
    pipe(
      provider,
      M.chain((removed) => pipe(hkt, M.useSome(removed))),
    )
}

export function provideSomeWith<F extends URIS2>(
  M: ProvideSome2<F> & Chain2<F>,
): <E1, A>(provider: Hkt<F, [E1, A]>) => Provider2<F, A, E1>

export function provideSomeWith<F extends URIS3>(
  M: ProvideSome3<F> & Chain3<F>,
): <R1, E1, A>(provider: Hkt<F, [R1, E1, A]>) => Provider3<F, A, R1, E1>

export function provideSomeWith<F extends URIS4>(
  M: ProvideSome3<F> & Chain3<F>,
): <S1, R1, E1, A>(provider: Hkt<F, [S1, R1, E1, A]>) => Provider4<F, A, R1, S1, E1>

export function provideSomeWith<F>(
  M: ProvideSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, A, E1>

export function provideSomeWith<F>(M: ProvideSome<F> & Chain<F>) {
  return <E1, A>(provider: HKT2<F, E1, A>) => <E2, B>(hkt: HKT2<F, A & E2, B>) =>
    pipe(
      provider,
      M.chain((removed) => pipe(hkt, M.provideSome(removed))),
    )
}

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
  return <R, A>(provider: HKT2<F, R, A>) => <B>(hkt: HKT2<F, A, B>) =>
    pipe(
      provider,
      M.chain((removed) => pipe(hkt, M.useAll(removed))),
    )
}

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
  return <R, A>(provider: HKT2<F, R, A>) => <B>(hkt: HKT2<F, A, B>) =>
    pipe(
      provider,
      M.chain((removed) => pipe(hkt, M.provideAll(removed))),
    )
}

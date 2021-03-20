import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { WidenI } from '../Widen'

/**
 * Type-class for providing some or all of the requirements.
 */
export interface Provide<F> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: HKT2<F, WidenI<A | B>, C>) => HKT2<F, B, C>
  readonly provideAll: <A>(provided: A) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, never, B>
  readonly useSome: Provide<F>['provideSome']
  readonly useAll: Provide<F>['provideAll']
}

export interface ProvideSome<F> extends Pick<Provide<F>, 'provideSome'> {}
export interface ProvideAll<F> extends Pick<Provide<F>, 'provideAll'> {}
export interface UseSome<F> extends Pick<Provide<F>, 'useSome'> {}
export interface UseAll<F> extends Pick<Provide<F>, 'useAll'> {}

export interface Provide2<F extends URIS2> {
  readonly provideSome: <A>(
    provided: A,
  ) => <B, C>(hkt: Kind2<F, WidenI<A | B>, C>) => Kind2<F, B, C>
  readonly provideAll: <A>(provided: A) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, never, B>
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
  ) => <B, E, C>(hkt: Kind3<F, WidenI<A | B>, E, C>) => Kind3<F, B, E, C>
  readonly provideAll: <A>(provided: A) => <E, C>(hkt: Kind3<F, A, E, C>) => Kind3<F, never, E, C>
  readonly useSome: Provide3<F>['provideSome']
  readonly useAll: Provide3<F>['provideAll']
}

export interface ProvideSome3<F extends URIS3> extends Pick<Provide3<F>, 'provideSome'> {}
export interface ProvideAll3<F extends URIS3> extends Pick<Provide3<F>, 'provideAll'> {}
export interface UseSome3<F extends URIS3> extends Pick<Provide3<F>, 'useSome'> {}
export interface UseAll3<F extends URIS3> extends Pick<Provide3<F>, 'useAll'> {}

export interface Provide3C<F extends URIS3, E> {
  readonly provideSome: <A>(
    provided: A,
  ) => <B, C>(hkt: Kind3<F, WidenI<A | B>, E, C>) => Kind3<F, B, E, C>
  readonly provideAll: <A>(provided: A) => <C>(hkt: Kind3<F, A, E, C>) => Kind3<F, never, E, C>
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
  ) => <R, B, E, C>(hkt: Kind4<F, R, WidenI<A | B>, E, C>) => Kind4<F, R, B, E, C>
  readonly provideAll: <A>(
    provided: A,
  ) => <R, E, C>(hkt: Kind4<F, R, A, E, C>) => Kind4<F, R, never, E, C>
  readonly useSome: Provide4<F>['provideSome']
  readonly useAll: Provide4<F>['provideAll']
}

export interface ProvideSome4<F extends URIS4> extends Pick<Provide4<F>, 'provideSome'> {}
export interface ProvideAll4<F extends URIS4> extends Pick<Provide4<F>, 'provideAll'> {}
export interface UseSome4<F extends URIS4> extends Pick<Provide4<F>, 'useSome'> {}
export interface UseAll4<F extends URIS4> extends Pick<Provide4<F>, 'useAll'> {}

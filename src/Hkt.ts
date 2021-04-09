import * as H from 'fp-ts/HKT'
import { L, N } from 'ts-toolbelt'

/**
 * Union of all the fp-ts URIs
 */
export type FpTsUri = H.URIS | H.URIS2 | H.URIS3 | H.URIS4

/**
 * Universal type for using all of fp-ts' internal kinds.
 * Initially intended for helping to create your own type-classes
 */
export type Hkt<F, Params extends readonly any[]> = F extends H.URIS
  ? H.Kind<F, Params[0]>
  : F extends H.URIS2
  ? H.Kind2<F, Params[0], Params[1]>
  : F extends H.URIS3
  ? H.Kind3<F, Params[0], Params[1], Params[2]>
  : F extends H.URIS4
  ? H.Kind4<F, Params[0], Params[1], Params[2], Params[3]>
  : Params['length'] extends 4
  ? H.HKT4<F, Params[0], Params[1], Params[2], Params[3]>
  : Params['length'] extends 3
  ? H.HKT3<F, Params[0], Params[1], Params[2]>
  : Params['length'] extends 2
  ? H.HKT2<F, Params[0], Params[1]>
  : H.HKT<F, Params[0]>

export type UriToLength<F, Params extends readonly any[] = readonly any[]> = F extends H.URIS
  ? 1
  : F extends H.URIS2
  ? 2
  : F extends H.URIS3
  ? 3
  : F extends H.URIS4
  ? 4
  : Params['length']

export type Param = S | R | E | A
export type S = 'S'
export type R = 'R'
export type E = 'E'
export type A = 'A'

export type Variance = Covariant | Contravariant
export type Covariant = '+'
export type Contravariant = '-'

export interface V<P extends Param, V extends Variance> {
  readonly Variance: {
    readonly [K in P]: () => V
  }
}

/**
 * A type-level map meant be extended, just like URItoKind*, to specify the
 * variance that should apply. If none is specified the default is to be strict.
 */
export interface VarianceMap {
  readonly Either: V<E, Covariant>
  readonly IOEither: V<E, Covariant>
  readonly Reader: V<E, Contravariant>
  readonly ReaderEither: V<R, Contravariant> & V<E, Covariant>
  readonly ReaderTask: V<E, Contravariant>
  readonly ReaderTaskEither: V<R, Contravariant> & V<E, Covariant>
  readonly StateReaderTaskEither: V<R, Contravariant> & V<E, Covariant>
  readonly TaskEither: V<E, Covariant>
  readonly TaskThese: V<E, Covariant>
  readonly These: V<E, Covariant>
}

export type ApplyVariance<
  F,
  P extends Param,
  T extends readonly any[]
> = F extends keyof VarianceMap
  ? VarianceMap[F] extends V<P, infer R>
    ? R extends Covariant
      ? T[number]
      : R extends Contravariant
      ? Intersect<T>
      : T[0]
    : T[0]
  : T[0]

export type Initial<F, P extends Param> = F extends keyof VarianceMap
  ? VarianceMap[F] extends V<P, infer R>
    ? R extends Covariant
      ? never
      : unknown
    : unknown
  : unknown

export type Intersect<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? Intersect<Tail, R & Head>
  : R

/**
 * Kind is able to combine multiple Uris and a list of parameters and
 * creates the combined type of all values. Useful for creating transformers.
 */
export type Kind<
  Uris extends readonly any[],
  Params extends readonly any[]
> = Uris extends readonly [any, ...infer Tail]
  ? Hkt<
      Uris[0],
      Tail extends []
        ? Params
        : [
            ...L.Take<Params, N.Sub<UriToLength<Uris[0], Params>, 1>>,
            Kind<
              Tail,
              UriToLength<Uris[0], Params> extends 1
                ? Params
                : L.Drop<Params, N.Sub<UriToLength<Uris[0], Params>, 1>>
            >,
          ]
    >
  : never

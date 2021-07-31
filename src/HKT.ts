/**
 * @typed/fp/HKT is an extension to fp-ts/HKT
 *
 * @since 0.9.2
 */
import * as H from 'fp-ts/HKT'

/**
 * Union of all the fp-ts URIs
 * @since 0.9.2
 * @category URI
 */
export type FpTsUri = H.URIS | H.URIS2 | H.URIS3 | H.URIS4

/**
 * Universal type for using all of fp-ts' internal kinds.
 * Initially intended for helping to create your own type-classes
 * @since 0.9.2
 * @category Type-level
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

/**
 * @since 0.9.2
 * @category Type-level
 */
export type UriToLength<F, Params extends readonly any[] = readonly any[]> = F extends H.URIS
  ? 1
  : F extends H.URIS2
  ? 2
  : F extends H.URIS3
  ? 3
  : F extends H.URIS4
  ? 4
  : Params['length']

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Param = S | R | E | A

/**
 * @since 0.9.2
 * @category Type-level
 */
export type S = 'S'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type R = 'R'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type E = 'E'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type A = 'A'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Variance = Covariant | Contravariant

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Covariant = '+'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Contravariant = '-'

/**
 * @since 0.9.2
 * @category Type-level
 */
export interface V<P extends Param, V extends Variance> {
  readonly Variance: {
    readonly [K in P]: () => V
  }
}

/**
 * A type-level map meant be extended, just like URItoKind*, to specify the
 * variance that should apply. If none is specified the default is to be strict.
 * @since 0.9.2
 * @category Type-level
 */
export interface URItoVariance {
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

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ApplyVariance<
  F,
  P extends Param,
  T extends readonly any[],
> = F extends keyof URItoVariance
  ? URItoVariance[F] extends V<P, infer R>
    ? R extends Covariant
      ? T[number]
      : Intersect<T>
    : T[0]
  : T[0]

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Initial<F, P extends Param> = F extends keyof URItoVariance
  ? URItoVariance[F] extends V<P, infer R>
    ? R extends Covariant
      ? never
      : unknown
    : any
  : any

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Intersect<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? Intersect<Tail, R & Head>
  : R

export * from 'fp-ts/HKT'

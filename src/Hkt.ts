/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { Cast } from 'ts-toolbelt/out/Any/Cast'
import { Equals } from 'ts-toolbelt/out/Any/Equals'

/**
 * Placeholder type for creating polymorphic functions for many different higher-kinded types
 */
export interface Hkt<Uri, A> {
  readonly _Uri: Uri
  readonly _A: A
}

export type HktValue<T> = T extends Hkt<any, infer R> ? R : never

export interface UriToKind<A> {}

export type Uris1 = keyof UriToKind<any>

export interface UriToKind2<A, B> {}

export type Uris2 = keyof UriToKind2<any, any>

export interface UriToKind3<A, B, C> {}

export type Uris3 = keyof UriToKind3<any, any, any>

export type Uris = Uris1 | Uris2 | Uris3

export type UriToLength<U extends Uris> = U extends Uris1
  ? 1
  : U extends Uris2
  ? 2
  : U extends Uris3
  ? 3
  : never

type PropOf<T, K, Fallback = never> = K extends keyof T ? T[K] : Fallback

export type Param = 'R' | 'E' | 'A'
export type Variance = '-' | '+' | '_'
export type V<P extends Param, V extends Variance> = {
  readonly [_ in P]: () => V
}

export interface UriToVariance {}

export type VarianceOf<Uri extends Uris, P extends Param> = Cast<
  Uri extends keyof UriToVariance ? (UriToVariance[Uri] extends V<P, infer R> ? R : '_') : '_',
  Variance
>

export type InitialOf<Uri extends Uris, P extends Param> = {
  '+': never
  '-': unknown
  _: any
}[VarianceOf<Uri, P>]

export type Kind<Uri extends Uris, Params extends DefaultParams<Uri> = DefaultParams<Uri>> = {
  1: PropOf<UriToKind<Params[0]>, Uri>
  2: PropOf<UriToKind2<Params[0], Params[1]>, Uri>
  3: PropOf<UriToKind3<Params[0], Params[1], Params[2]>, Uri>
}[UriToLength<Uri>]

type DefaultParams<Uri extends Uris> = {
  1: readonly [a: any]
  2: readonly [e: any, a: any]
  3: readonly [r: any, e: any, a: any]
}[UriToLength<Uri>]

export type ParamOf<U extends Uris, P extends Param, T> = {
  1: {
    R: never
    E: never
    A: Params1Of<Cast<U, Uris1>, T>
  }[P]
  2: {
    R: never
    E: Params2Of<Cast<U, Uris2>, 'E', T>
    A: Params2Of<Cast<U, Uris2>, 'A', T>
  }[P]
  3: {
    R: Params3Of<Cast<U, Uris3>, 'R', T>
    E: Params3Of<Cast<U, Uris3>, 'E', T>
    A: Params3Of<Cast<U, Uris3>, 'A', T>
  }[P]
}[UriToLength<U>]

type Params1Of<U extends Uris1, T> = {
  _: [T] extends [UriToKind<infer R>[U]] ? R : never
  '+': [T] extends [UriToKind<infer R>[U]] ? UnknownToNever<R> : never
  '-': [T] extends [UriToKind<infer R>[U]] ? NeverToUnknown<R> : unknown
}[VarianceOf<U, 'A'>]

type Params2Of<U extends Uris2, P extends 'E' | 'A', T> = {
  E: {
    _: [T] extends [UriToKind2<infer R, any>[U]] ? R : never
    '+': [T] extends [UriToKind2<infer R, any>[U]] ? UnknownToNever<R> : never
    '-': [T] extends [UriToKind2<infer R, any>[U]] ? NeverToUnknown<R> : unknown
  }[VarianceOf<U, 'E'>]
  A: {
    _: [T] extends [UriToKind2<any, infer R>[U]] ? R : never
    '+': [T] extends [UriToKind2<any, infer R>[U]] ? UnknownToNever<R> : never
    '-': [T] extends [UriToKind2<any, infer R>[U]] ? NeverToUnknown<R> : unknown
  }[VarianceOf<U, 'A'>]
}[P]

type Params3Of<U extends Uris3, P extends Param, T> = {
  R: {
    _: [T] extends [UriToKind3<infer R, any, any>[U]] ? R : never
    '+': [T] extends [UriToKind3<infer R, any, any>[U]] ? UnknownToNever<R> : never
    '-': [T] extends [UriToKind3<infer R, any, any>[U]] ? NeverToUnknown<R> : unknown
  }[VarianceOf<U, 'R'>]
  E: {
    _: [T] extends [UriToKind3<any, infer R, any>[U]] ? R : never
    '+': [T] extends [UriToKind3<any, infer R, any>[U]] ? UnknownToNever<R> : never
    '-': [T] extends [UriToKind3<any, infer R, any>[U]] ? NeverToUnknown<R> : unknown
  }[VarianceOf<U, 'E'>]
  A: {
    _: [T] extends [UriToKind3<any, any, infer R>[U]] ? R : never
    '+': [T] extends [UriToKind3<any, any, infer R>[U]] ? UnknownToNever<R> : never
    '-': [T] extends [UriToKind3<any, any, infer R>[U]] ? NeverToUnknown<R> : unknown
  }[VarianceOf<U, 'A'>]
}[P]

export type TupleToIntersection<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? TupleToIntersection<Tail, R & Head>
  : R

export type TupleToUnion<A extends readonly any[]> = A[number]

type UnknownToNever<A> = Equals<A, unknown> extends 1 ? never : A
type NeverToUnknown<A> = Equals<A, never> extends 1 ? unknown : A

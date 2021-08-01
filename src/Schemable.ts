/**
 * **This module is experimental**
 *
 * @since 0.9.4
 */
import { HKT, Kind, Kind2, URIS, URIS2 } from 'fp-ts/HKT'
import { Refinement } from 'fp-ts/Refinement'

import { Branded, ValueOf } from './Branded'

/**
 * @since 0.9.4
 */
export type Literal = string | number | boolean | null

/**
 * @since 0.9.4
 */
export interface Schemable<S> {
  readonly URI: S
  readonly literal: <A extends readonly [Literal, ...Array<Literal>]>(
    ...values: A
  ) => HKT<S, A[number]>
  readonly string: HKT<S, string>
  readonly number: HKT<S, number>
  readonly boolean: HKT<S, boolean>
  readonly nullable: <A>(or: HKT<S, A>) => HKT<S, null | A>
  readonly struct: <A>(
    properties: { [K in keyof A]: HKT<S, A[K]> },
  ) => HKT<S, { [K in keyof A]: A[K] }>

  readonly record: <A>(codomain: HKT<S, A>) => HKT<S, Record<string, A>>
  readonly array: <A>(item: HKT<S, A>) => HKT<S, Array<A>>
  readonly tuple: <A extends ReadonlyArray<unknown>>(
    ...components: { readonly [K in keyof A]: HKT<S, A[K]> }
  ) => HKT<S, A>
  readonly intersect: <B>(right: HKT<S, B>) => <A>(left: HKT<S, A>) => HKT<S, A & B>
  readonly sum: <T extends string>(
    tag: T,
  ) => <A>(members: { [K in keyof A]: HKT<S, A[K] & Record<T, K>> }) => HKT<S, A[keyof A]>
  readonly lazy: <A>(id: string, f: () => HKT<S, A>) => HKT<S, A>

  readonly branded: <A extends Branded<any, any>>(item: HKT<S, ValueOf<A>>) => HKT<S, A>
  readonly unknownArray: HKT<S, Array<unknown>>
  readonly unknownRecord: HKT<S, Record<string, unknown>>
}

/**
 * @since 0.9.4
 */
export interface Schemable1<S extends URIS> {
  readonly URI: S
  readonly literal: <A extends readonly [Literal, ...Array<Literal>]>(
    ...values: A
  ) => Kind<S, A[number]>
  readonly string: Kind<S, string>
  readonly number: Kind<S, number>
  readonly boolean: Kind<S, boolean>
  readonly nullable: <A>(or: Kind<S, A>) => Kind<S, null | A>
  readonly struct: <A>(
    properties: { [K in keyof A]: Kind<S, A[K]> },
  ) => Kind<S, { [K in keyof A]: A[K] }>
  readonly record: <A>(codomain: Kind<S, A>) => Kind<S, Record<string, A>>
  readonly array: <A>(item: Kind<S, A>) => Kind<S, Array<A>>
  readonly tuple: <A extends ReadonlyArray<unknown>>(
    ...components: { readonly [K in keyof A]: Kind<S, A[K]> }
  ) => Kind<S, A>
  readonly intersect: <B>(right: Kind<S, B>) => <A>(left: Kind<S, A>) => Kind<S, A & B>
  readonly sum: <T extends string>(
    tag: T,
  ) => <A>(members: { [K in keyof A]: Kind<S, A[K] & Record<T, K>> }) => Kind<S, A[keyof A]>
  readonly lazy: <A>(id: string, f: () => Kind<S, A>) => Kind<S, A>
  readonly branded: <A extends Branded<any, any>>(item: Kind<S, ValueOf<A>>) => Kind<S, A>
  readonly unknownArray: Kind<S, Array<unknown>>
  readonly unknownRecord: Kind<S, Record<string, unknown>>
}

/**
 * @since 0.9.4
 */
export interface Schemable2C<S extends URIS2, E> {
  readonly URI: S
  readonly literal: <A extends readonly [Literal, ...Array<Literal>]>(
    ...values: A
  ) => Kind2<S, E, A[number]>
  readonly string: Kind2<S, E, string>
  readonly number: Kind2<S, E, number>
  readonly boolean: Kind2<S, E, boolean>
  readonly nullable: <A>(or: Kind2<S, E, A>) => Kind2<S, E, null | A>
  readonly optional: <A>(or: Kind2<S, E, A>) => Kind2<S, E, undefined | A>
  readonly struct: <A>(
    properties: { [K in keyof A]: Kind2<S, E, A[K]> },
  ) => Kind2<S, E, { [K in keyof A]: A[K] }>
  readonly record: <A>(codomain: Kind2<S, E, A>) => Kind2<S, E, Record<string, A>>
  readonly array: <A>(item: Kind2<S, E, A>) => Kind2<S, E, ReadonlyArray<A>>
  readonly tuple: <A extends readonly unknown[]>(
    ...components: { readonly [K in keyof A]: Kind2<S, E, A[K]> }
  ) => Kind2<S, E, A>
  readonly intersect: <B>(right: Kind2<S, E, B>) => <A>(left: Kind2<S, E, A>) => Kind2<S, E, A & B>
  readonly sum: <T extends string>(
    tag: T,
  ) => <A>(members: { [K in keyof A]: Kind2<S, E, A[K] & Record<T, K>> }) => Kind2<S, E, A[keyof A]>
  readonly lazy: <A>(id: string, f: () => Kind2<S, E, A>) => Kind2<S, E, A>
  readonly branded: <A extends Branded<any, any>>(item: Kind2<S, E, ValueOf<A>>) => Kind2<S, E, A>
  readonly unknownArray: Kind2<S, E, ReadonlyArray<unknown>>
  readonly unknownRecord: Kind2<S, E, Record<string, unknown>>
}

/**
 * @since 0.9.4
 */
export interface WithUnion<S> {
  readonly union: <A>(second: HKT<S, A>) => <B>(first: HKT<S, B>) => HKT<S, A | B>
}

/**
 * @since 0.9.4
 */
export interface WithUnion1<S extends URIS> {
  readonly union: <A>(second: Kind<S, A>) => <B>(first: Kind<S, B>) => Kind<S, A | B>
}

/**
 * @since 0.9.4
 */
export interface WithUnion2C<S extends URIS2, E> {
  readonly union: <A>(second: Kind2<S, E, A>) => <B>(first: Kind2<S, E, B>) => Kind2<S, E, A | B>
}

/**
 * @since 0.9.4
 */
export interface WithRefine<S> {
  readonly refine: <A, B extends A>(
    refinement: Refinement<A, B>,
    id: string,
  ) => (from: HKT<S, A>) => HKT<S, B>
}

/**
 * @since 0.9.4
 */
export interface WithRefine1<S extends URIS> {
  readonly refine: <A, B extends A>(
    refinement: Refinement<A, B>,
    id: string,
  ) => (from: Kind<S, A>) => Kind<S, B>
}

/**
 * @since 0.9.4
 */
export interface WithRefine2C<S extends URIS2, E> {
  readonly refine: <A, B extends A>(
    refinement: Refinement<A, B>,
    id: string,
  ) => (from: Kind2<S, E, A>) => Kind2<S, E, B>
}

/**
 * @since 0.9.4
 */
export function memoize<A, B>(f: (a: A) => B): (a: A) => B {
  const cache = new Map()
  return (a) => {
    if (!cache.has(a)) {
      const b = f(a)
      cache.set(a, b)
      return b
    }
    return cache.get(a)
  }
}

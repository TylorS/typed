/**
 * Eq Instance for some common scenarios including deep equality.
 *
 * @since 0.9.2
 */

import fde from 'fast-deep-equal'
import * as B from 'fp-ts/boolean'
import * as D from 'fp-ts/Date'
import * as Eq from 'fp-ts/Eq'
import * as N from 'fp-ts/number'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as S from 'fp-ts/string'

import { constant, constFalse, constTrue } from './function'
import { memoize } from './internal'
import { Schemable1 } from './Schemable'

/**
 * @since 0.9.2
 * @category Instance
 */
export const alwaysEqualsEq: Eq.Eq<any> = { equals: constant(constTrue) }

/**
 * @since 0.9.2
 * @category Instance
 */
export const neverEqualsEq: Eq.Eq<any> = { equals: constant(constFalse) }

/**
 * A deep-equality Eq instance.
 * Supports Reference equality, all JavaScript Primitives including `RegExp`, `Set` and `Map`.
 * @since 0.9.2
 * @category Instance
 */
export const deepEqualsEq: Eq.Eq<unknown> = Eq.fromEquals<unknown>((b) => (a) => fde(a, b))

// -------------------------------------------------------------------------------------
// primitives
// -------------------------------------------------------------------------------------

/**
 * @category primitives
 * @since 0.9.5
 */
export const string: Eq.Eq<string> = S.Eq

/**
 * @category primitives
 * @since 0.9.5
 */
export const number: Eq.Eq<number> = N.Eq

/**
 * @category primitives
 * @since 0.9.5
 */
export const boolean: Eq.Eq<boolean> = B.Eq

/**
 * @category primitives
 * @since 0.9.5
 */
export const unknownArray: Eq.Eq<ReadonlyArray<unknown>> = Eq.fromEquals(
  (second) => (first) => first.length === second.length,
)

/**
 * @category primitives
 * @since 0.9.5
 */
export const unknownRecord: Eq.Eq<Readonly<Record<string, unknown>>> = Eq.fromEquals(
  (second) => (first) => {
    for (const k in first) {
      if (!(k in second)) {
        return false
      }
    }
    for (const k in second) {
      if (!(k in first)) {
        return false
      }
    }
    return true
  },
)

// -------------------------------------------------------------------------------------
// Combinator
// -------------------------------------------------------------------------------------

/**
 * @category Combinator
 * @since 0.9.5
 */
export const nullable = <A>(or: Eq.Eq<A>): Eq.Eq<null | A> =>
  Eq.fromEquals(
    (second) => (first) =>
      first === null || second === null ? first === second : or.equals(second)(first),
  )

/**
 * @category Combinator
 * @since 0.9.5
 */
export const optional = <A>(or: Eq.Eq<A>): Eq.Eq<undefined | A> =>
  Eq.fromEquals(
    (second) => (first) =>
      first === undefined || second === undefined ? first === second : or.equals(second)(first),
  )

/**
 * @category Combinator
 * @since 0.9.5
 */
export const tuple: <A extends ReadonlyArray<unknown>>(
  ...components: { [K in keyof A]: Eq.Eq<A[K]> }
) => Eq.Eq<A> = Eq.tuple

/**
 * @category Combinator
 * @since 2.2.15
 */
export const struct: <A>(
  properties: { [K in keyof A]: Eq.Eq<A[K]> },
) => Eq.Eq<{ [K in keyof A]: A[K] }> = Eq.struct

/**
 * @category Combinator
 * @since 0.9.5
 */
export const partial = <A>(
  properties: { [K in keyof A]: Eq.Eq<A[K]> },
): Eq.Eq<Partial<{ [K in keyof A]: A[K] }>> =>
  Eq.fromEquals((second) => (first) => {
    for (const k in properties) {
      const xk = first[k]
      const yk = second[k]
      if (!(xk === undefined || yk === undefined ? xk === yk : properties[k].equals(xk!)(yk!))) {
        return false
      }
    }
    return true
  })

/**
 * @category Combinator
 * @since 0.9.5
 */
export const array: <A>(item: Eq.Eq<A>) => Eq.Eq<Array<A>> = RA.getEq

/**
 * @category Combinator
 * @since 0.9.5
 */
export const record: <A>(codomain: Eq.Eq<A>) => Eq.Eq<Record<string, A>> = RR.getEq

/**
 * @category Combinator
 * @since 0.9.5
 */
export const intersect =
  <B>(right: Eq.Eq<B>) =>
  <A>(left: Eq.Eq<A>): Eq.Eq<A & B> =>
    Eq.fromEquals((second) => (first) => left.equals(second)(first) && right.equals(second)(first))

/**
 * @category Combinator
 * @since 0.9.5
 */
export function lazy<A>(f: () => Eq.Eq<A>): Eq.Eq<A> {
  const get = memoize<void, Eq.Eq<A>>(f)
  return {
    equals: (second) => (first) => get().equals(second)(first),
  }
}

/**
 * @category Combinator
 * @since 0.9.5
 */
export const sum = <T extends string>(
  tag: T,
): (<A>(members: { [K in keyof A]: Eq.Eq<A[K] & Record<T, K>> }) => Eq.Eq<A[keyof A]>) => {
  return (members: Record<string, Eq.Eq<any>>) =>
    Eq.fromEquals((second: Record<string, any>) => (first: Record<string, any>) => {
      const ftag = first[tag]
      return ftag === second[tag] && members[ftag].equals(second)(first)
    })
}

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    readonly '@typed/fp/ToEq': Eq.Eq<A>
  }
}

/**
 * @category Instance
 * @since 0.9.4
 */
export const Schemable: Schemable1<'@typed/fp/ToEq'> = {
  URI: '@typed/fp/ToEq',
  string,
  number,
  boolean,
  date: D.Eq,
  literal: () => Eq.EqStrict,
  tuple,
  struct,
  array,
  record,
  nullable,
  intersect,
  lazy: (_, f) => lazy(f),
  sum,
  branded: (e) => e as any,
  unknownArray,
  unknownRecord,
}

export * from 'fp-ts/Eq'

/**
 * Eq Instance for some common scenarios including deep equality.
 *
 * @since 0.9.2
 */

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

const FUNCTION_NAME_REGEX = /^function\s*([\w$]+)/
const DEFAULT_MATCH = ['', '']

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
export const deepEqualsEq: Eq.Eq<unknown> = { equals }

function equals(a: any) {
  return (b: any) => _equals(a, b)
}

function _equals(a: any, b: any, stackA: any[] = [], stackB: any[] = []) {
  if (Object.is(a, b)) {
    return true
  }

  const typeA = typeOf(a)

  if (typeA !== typeOf(b)) {
    return false
  }

  if (a == null || b == null) {
    return false
  }

  switch (typeA) {
    case 'Arguments':
    case 'Array':
    case 'Object':
      if (typeof a.constructor === 'function' && functionName(a.constructor) === 'Promise') {
        return a === b
      }
      break
    case 'Boolean':
    case 'Number':
    case 'String':
      if (!(typeof a === typeof b && Object.is(a.valueOf(), b.valueOf()))) {
        return false
      }
      break
    case 'Date':
      if (!Object.is(a.valueOf(), b.valueOf())) {
        return false
      }
      break
    case 'Error':
      return a.name === b.name && a.message === b.message
    case 'RegExp':
      if (
        !(
          a.source === b.source &&
          a.global === b.global &&
          a.ignoreCase === b.ignoreCase &&
          a.multiline === b.multiline &&
          a.sticky === b.sticky &&
          a.unicode === b.unicode
        )
      ) {
        return false
      }
      break
  }

  let idx = stackA.length - 1
  while (idx >= 0) {
    if (stackA[idx] === a) {
      return stackB[idx] === b
    }
    idx -= 1
  }

  switch (typeA) {
    case 'Map':
      if (a.size !== b.size) {
        return false
      }

      return _uniqContentEquals(a.entries(), b.entries(), stackA.concat([a]), stackB.concat([b]))
    case 'Set':
      if (a.size !== b.size) {
        return false
      }

      return _uniqContentEquals(a.values(), b.values(), stackA.concat([a]), stackB.concat([b]))
    case 'Arguments':
    case 'Array':
    case 'Object':
    case 'Boolean':
    case 'Number':
    case 'String':
    case 'Date':
    case 'Error':
    case 'RegExp':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'ArrayBuffer':
      break
    default:
      // Values of other types are only equal if identical.
      return false
  }

  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) {
    return false
  }

  const extendedStackA = stackA.concat([a])
  const extendedStackB = stackB.concat([b])

  idx = keysA.length - 1
  while (idx >= 0) {
    const key = keysA[idx]
    if (
      !(
        Object.prototype.hasOwnProperty.call(b, key) &&
        _equals(b[key], a[key], extendedStackA, extendedStackB)
      )
    ) {
      return false
    }
    idx -= 1
  }
  return true
}

function _uniqContentEquals(
  aIterable: Iterable<any>,
  bIterable: Iterable<any>,
  stackA: any[],
  stackB: any[],
): boolean {
  const a = Array.from(aIterable)
  const b = Array.from(bIterable)

  function eq(_a: any, _b: any): boolean {
    return _equals(_a, _b, stackA.slice(), stackB.slice())
  }

  // if *a* array contains any element that is not included in *b*
  return !includesWith((b: any, aItem: any) => !includesWith(eq, aItem, b), b, a)
}

function includesWith<A, B>(
  pred: (value: A, item: B, index: number) => boolean,
  x: A,
  list: B[],
): boolean {
  let idx = 0
  const len = list.length

  while (idx < len) {
    if (pred(x, list[idx], idx)) {
      return true
    }
    idx += 1
  }
  return false
}

function typeOf(value: any): string {
  if (value === null) {
    return 'Null'
  }

  if (value === void 0) {
    return `Undefined`
  }

  return Object.prototype.toString.call(value).slice(8, -1)
}

function functionName(fn: Function): string {
  if (fn.name) {
    return fn.name
  }

  const [, name] = String(fn).match(FUNCTION_NAME_REGEX) || DEFAULT_MATCH

  return name
}

// TODO: move to io-ts-contrib in v3

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

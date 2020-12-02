import { Json, JsonArray, JsonRecord } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { all } from './all'
import { complement } from './complement'
import { equals } from './equals'
import { isObject } from './isObject'
import { JsonPrimitive } from './json'
import { negate } from './negate'
import { or } from './or'
import { Is, IsNot } from './types'

/**
 * Create a function for checking if something is equal to a given value.
 */
export const is = <A>(value: A): Is<A> => equals(value) as any

/**
 * Create a function for checking if something is not equal to a given value.
 */
export const isNot = <A>(a: A): IsNot<A> => flow(is(a), negate) as any

/**
 * Create both Is<A> and IsNot<A> instances for a value.
 */
export const isAndIsNot = <A>(value: A): readonly [Is<A>, IsNot<A>] =>
  [is(value), isNot(value)] as const

/**
 * Check if a value is not a function.
 */
export const isNotFunction: IsNot<Function> = complement(isFunction)

/**
 * Check if a value is not a Map
 */
export const isNotMap: IsNot<Map<unknown, unknown>> = complement(isMap)

/**
 * Check if a value is not a Set
 */
export const isNotSet: IsNot<Set<unknown>> = complement(isSet)

/**
 * Check if a value is or is not undefined
 */
const [isUndefined, isNotUndefined] = isAndIsNot(undefined)

export { isNotUndefined, isUndefined }

/**
 * Check if a value is or is not null
 */
const [isNull, isNotNull] = isAndIsNot(null)

export { isNotNull, isNull }

/**
 * Check if a value is an Array
 */
export function isArray(x: unknown): x is unknown[] {
  return Array.isArray(x)
}

/**
 * Check if a value is not an Array
 */
export const isNotArray: IsNot<ReadonlyArray<unknown>> = complement(isArray)

/**
 * Check if a value is an Iterator
 */
export function isIterator(x: unknown): x is Iterator<unknown> {
  return !!x && isFunction((x as Iterator<unknown>).next)
}

/**
 * Check if a value is not an Iterator
 */
export const isNotIterator: IsNot<Iterator<unknown>> = complement(isIterable)

/**
 * Check if a value is an interable
 */
export function isIterable(x: unknown): x is Iterable<unknown> {
  return !!x && isFunction((x as Iterable<unknown>)[Symbol.iterator])
}

/**
 * Check if a value is not an interable
 */
export const isNotIterable: IsNot<Iterable<unknown>> = complement(isIterable)

/**
 * Check if a value is a Generator
 */
export const isGenerator: Is<Generator<unknown, unknown, unknown>> = (
  x: unknown,
): x is Generator<unknown, unknown, unknown> => {
  return (
    isIterable(x) &&
    isFunction((x as Generator).next) &&
    isFunction((x as Generator).return) &&
    isFunction((x as Generator).throw)
  )
}

/**
 * Check if a value is not a Generator
 */
export const isNotGenerator = complement(isGenerator)

/**
 * Check if a value is a ArrayLike
 */
export const isArrayLike: Is<ArrayLike<unknown>> = (x): x is ArrayLike<unknown> => {
  if (isArray(x)) {
    return true
  }

  if (!x || !isObject(x) || !isString(x)) {
    return false
  }

  const asObj: { length: number } = x

  if (asObj.length === 0) {
    return true
  }

  if (asObj.length > 0) {
    return (
      Object.prototype.hasOwnProperty.call(x, 0) &&
      Object.prototype.hasOwnProperty.call(x, asObj.length - 1)
    )
  }

  return false
}

/**
 * Check if a value is not a ArrayLike
 */
export const isNotArrayLike = complement(isArrayLike)

/**
 * Check if a value is a number
 */
export const isNumber: Is<number> = (u): u is number => typeof u === 'number' && !Number.isNaN(u)

/**
 * Check if a value is not a number
 */
export const isNotNumber: IsNot<number> = complement(isNumber)

/**
 * Check if a value is a string
 */
export const isString: Is<string> = (u): u is string => typeof u === 'string'

/**
 * Check if a value is not a string
 */
export const isNotString: IsNot<string> = complement(isString)

/**
 * Check if a value is a Record
 */
export const isRecord: Is<Readonly<Record<PropertyKey, unknown>>> = (
  u,
): u is Readonly<Record<PropertyKey, unknown>> =>
  !!u && isObject(u) && isNotArrayLike(u) && isNotMap(u) && isNotSet(u)

/**
 * Check if a value is not a Record
 */
export const isNotRecord: IsNot<Readonly<Record<PropertyKey, unknown>>> = complement(isRecord)

/**
 * Check if a value is not a PromiseLike
 */
export const isPromiseLike: Is<PromiseLike<unknown>> = (x: unknown): x is PromiseLike<unknown> =>
  !!x && isObject(x) && isFunction((x as PromiseLike<unknown>).then)

/**
 * Check if a value is not PromiseLike
 */
export const isNotPromiseLie: IsNot<PromiseLike<unknown>> = complement(isPromiseLike)

/**
 * Check if a value is or is not true
 */
const [isTrue, isNotTrue] = isAndIsNot<true>(true)

export { isNotTrue, isTrue }

/**
 * Check if a value is or is not false
 */
const [isFalse, isNotFalse] = isAndIsNot<false>(false)

export { isFalse, isNotFalse }

/**
 * Check if a value is or is not boolean
 */
export const isBoolean: Is<boolean> = or(isTrue, isFalse)
export const isNotBoolean: IsNot<boolean> = complement(isBoolean)

/**
 * Check if a value is a JsonArray
 */
export const isJsonArray: Is<JsonArray> = function isJsonArray(x: unknown): x is JsonArray {
  return isArray(x) && all(isJson, x)
}

/**
 * Check if a value is not a JsonArray
 */
export const isNotJsonArray: IsNot<JsonArray> = complement(isJsonArray)

/**
 * Check if a value is a JsonRecord
 */
export const isJsonRecord: Is<JsonRecord> = function isJsonObject(x: unknown): x is JsonRecord {
  return (
    !isArray(x) && isObject(x) && all(isString, Object.keys(x)) && all(isJson, Object.values(x))
  )
}

/**
 * Check if a value is not a JsonRecord
 */
export const isNotJsonRecord: IsNot<JsonRecord> = complement(isJsonRecord)

/**
 * Check if a value is a Json primitive
 */
export const isJsonPrimitive: Is<JsonPrimitive> = or(isString, or(isNumber, or(isBoolean, isNull)))

/**
 * Check if a value is not a Json primitive
 */
export const isNotJsonPrimitive: IsNot<JsonPrimitive> = complement(isJsonPrimitive)

/**
 * Check if a value is Json
 */
export const isJson: Is<Json> = or(isJsonPrimitive, or(isJsonArray, isJsonRecord))

/**
 * Check if a value is not Json
 */
export const isNotJson: IsNot<Json> = complement(isJson)

/**
 * Check if a value is a Date
 */
export const isDate: Is<Date> = (u): u is Date => u instanceof Date

/**
 * Check if a value is not a Date
 */
export const isNotDate: IsNot<Date> = complement(isDate)

/**
 * Check if a value is a Map
 */
export function isMap<A = unknown, B = unknown>(x: any): x is Map<A, B> {
  if (!x) {
    return false
  }

  const map = x as Map<A, B>

  return (
    isFunction(map.set) &&
    isFunction(map.get) &&
    isFunction(map.has) &&
    isFunction(map.delete) &&
    isFunction(map.clear) &&
    isFunction(map[Symbol.iterator])
  )
}

/**
 * Check if a value is a Set
 */
export function isSet<A = any>(x: any): x is Set<A> {
  if (!x) {
    return false
  }

  const set = x as Set<A>

  return (
    isFunction(set.add) &&
    isFunction(set.clear) &&
    isFunction(set.delete) &&
    isFunction(set.has) &&
    isFunction(set[Symbol.iterator])
  )
}

/**
 * Check if a value is a Function
 */
export function isFunction(x: any): x is Function {
  return typeof x === 'function'
}

import { Eq } from 'fp-ts/lib/Eq'

import { functionName } from './functionName'
import { includesWith } from './includesWith'
import { typeOf } from './typeOf'

export const deepEqualsEq: Eq<unknown> = { equals }

function equals(a: any, b: any) {
  return _equals(a, b)
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

      return _uniqContentEquals(
        (a as Map<any, any>).entries(),
        b.entries(),
        stackA.concat([a]),
        stackB.concat([b]),
      )
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

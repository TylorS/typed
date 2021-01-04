import { deepEqualsEq } from '@fp/common/exports'
import { curry } from '@fp/lambda/exports'

/**
 * Deep Equality check of 2 values.
 */
export const equals = curry(<A>(a: A, b: A): boolean => deepEqualsEq.equals(a, b)) as {
  <A>(a: A, b: A): boolean
  <A>(a: A): (b: A) => boolean
}

import { complement } from './complement'
import { Is, IsNot } from './types'

/**
 * Check if a value is an Object
 */
export const isObject: Is<object> = (u): u is object => !!u && typeof u === 'object'

/**
 * Check if a value is not an Object
 */
export const isNotObject: IsNot<object> = complement(isObject)

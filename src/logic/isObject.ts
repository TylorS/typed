import { complement } from './complement'
import { Is, IsNot } from './types'

export const isObject: Is<object> = (u): u is object => !!u && typeof u === 'object'
export const isNotObject: IsNot<object> = complement(isObject)

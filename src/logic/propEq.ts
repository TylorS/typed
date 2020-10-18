import { curry } from '@typed/fp/lambda/exports'

import { equals } from './equals'

/**
 * Returns true if a property is equal to a given value
 * @param key PropertyKey
 * @param value a
 * @param obj { [PropertyKey]: a }
 * @returns boolean
 */
export const propEq = (curry(<O, K extends keyof O>(key: K, value: O[K], obj: O): boolean =>
  equals(obj[key], value),
) as any) as {
  <K extends PropertyKey, A, O extends Readonly<Record<K, A>>>(key: K, value: A, object: O): boolean
  <K extends PropertyKey, A>(key: K, value: A): <O extends Readonly<Record<K, A>>>(
    object: O,
  ) => boolean
  <K extends PropertyKey>(key: K): {
    <A, O extends Readonly<Record<K, A>>>(value: A, object: O): boolean
    <A>(value: A): <O extends Readonly<Record<K, A>>>(object: O) => boolean
  }
}

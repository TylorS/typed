import { curry } from '@typed/fp/lambda/exports'

/**
 * Get the value of a property if present or use default value.
 * @param defaultValue :: a
 * @param key :: PropertyKey
 * @param obj :: { [PropertyKey]?: a }
 * @returns :: a
 */
export const propOr: {
  <A, K extends PropertyKey>(defaultValue: A, key: K, obj: { [Key in K]: A }): A
  <A, K extends PropertyKey>(defaultValue: A, key: K): (obj: { [Key in K]: A }) => A
  <A>(defaultValue: A): {
    <K extends PropertyKey>(key: K, obj: { [Key in K]: A }): A
    <K extends PropertyKey>(key: K): (obj: { [Key in K]: A }) => A
  }
} = curry(__propOr) as {
  <A, K extends PropertyKey>(defaultValue: A, key: K, obj: { [Key in K]: A }): A
  <A, K extends PropertyKey>(defaultValue: A, key: K): (obj: { [Key in K]: A }) => A
  <A>(defaultValue: A): {
    <K extends PropertyKey>(key: K, obj: { [Key in K]: A }): A
    <K extends PropertyKey>(key: K): (obj: { [Key in K]: A }) => A
  }
}

function __propOr<A, K extends PropertyKey>(defaultValue: A, key: K, obj: { [Key in K]: A }): A {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : defaultValue
}

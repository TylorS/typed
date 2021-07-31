/**
 * @typed/fp/string is an extension of fp-ts/string with additional
 * type-class instances.
 * @since 0.9.2
 */
import { L } from 'ts-toolbelt'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const captialize = <S extends string>(s: S): Capitalize<S> =>
  (s.length === 0 ? s : `${s[0].toUpperCase()}${s.slice(1)}`) as Capitalize<S>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const uncaptialize = <S extends string>(s: S): Uncapitalize<S> =>
  (s.length === 0 ? s : `${s[0].toLowerCase()}${s.slice(1)}`) as Uncapitalize<S>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const upperCase = <S extends string>(s: S): Uppercase<S> => s.toUpperCase() as Uppercase<S>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const lowerCase = <S extends string>(s: S): Lowercase<S> => s.toLowerCase() as Lowercase<S>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ConcatStrings<A extends readonly string[], R extends string = ''> = [] extends A
  ? R
  : ConcatStrings<L.Drop<A, 1>, `${R}${A[0]}`>

/**
 * @since 0.9.2
 * @category Combinator
 */
export function concat<S extends readonly string[]>(...strings: S): ConcatStrings<S> {
  return strings.join() as ConcatStrings<S>
}

export * from 'fp-ts/string'

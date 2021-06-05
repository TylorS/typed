import { L } from 'ts-toolbelt'

export const captialize = <S extends string>(s: S): Capitalize<S> =>
  (s.length === 0 ? s : `${s[0].toUpperCase()}${s.slice(1)}`) as Capitalize<S>

export const uncaptialize = <S extends string>(s: S): Uncapitalize<S> =>
  (s.length === 0 ? s : `${s[0].toLowerCase()}${s.slice(1)}`) as Uncapitalize<S>

export const upperCase = <S extends string>(s: S): Uppercase<S> => s.toUpperCase() as Uppercase<S>

export const lowerCase = <S extends string>(s: S): Lowercase<S> => s.toLowerCase() as Lowercase<S>

export type ConcatStrings<A extends readonly string[], R extends string = ''> = [] extends A
  ? R
  : ConcatStrings<L.Drop<A, 1>, `${R}${A[0]}`>

export function concat<S extends readonly string[]>(...strings: S): ConcatStrings<S> {
  return strings.join() as ConcatStrings<S>
}

export * from 'fp-ts/string'

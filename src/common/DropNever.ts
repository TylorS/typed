import { IsNever } from './types'

/**
 * Remove all keys in an object that evaluate to `never`
 * @example
 * DropNever<{ a: 1, b: never }> == { a: 1 }
 */
export type DropNever<A> = { readonly [K in DropNeverKeys<A>]: A[K] }

/**
 * Get all of the keys in an object that do not evaluate to `never`.
 * @example
 * DropNeverKeys<{ a: 1, b: 2, c: never }> == 'a' | 'b'
 */
export type DropNeverKeys<A> = {
  readonly [K in keyof A]: IsNever<A[K]> extends true ? never : K
}[keyof A]

/**
 * Extract the Arguments from a Function type.
 */
export type ArgsOf<A> = A extends (...args: infer R) => any ? R : never

/**
 * Extract the first argument from a Function type.
 */
export type HeadArg<A> = ArgsOf<A>[0]

/**
 * A type-level helper for functions with an arity of 1.
 */
export type Arity1<A = any, B = any> = (value: A) => B

/**
 * A type-level helper for functions with an arity of 2.
 */
export type Arity2<A = any, B = any, C = any> = (a: A, b: B) => C

/**
 * A type-level helper for functions with an arity of 3.
 */
export type Arity3<A = any, B = any, C = any, D = any> = (a: A, b: B, c: C) => D

/**
 * A type-level helper for functions with an arity of 4.
 */
export type Arity4<A = any, B = any, C = any, D = any, E = any> = (a: A, b: B, c: C, d: D) => E

/**
 * A type-level helper for functions with an arity of 5.
 */
export type Arity5<A = any, B = any, C = any, D = any, E = any, F = any> = (
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
) => F

/**
 * A type-level helper for checking for strict equality between types.
 */
export type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

/**
 * Check if a value is strictly equal to never
 */
export type IsNever<A> = Equals<A, never>

/**
 * Check if a value is strictly equal to unknown
 */
export type IsUnknown<A> = Equals<A, unknown>

/**
 * Use TS laziness to avoid inference in a particular function argument.
 * @example
 * function foo<A>(value: NoInfer<A>, fn:(inferFromHere: A) => void) { ... }
 */
export type NoInfer<T> = [T][T extends any ? 0 : never]

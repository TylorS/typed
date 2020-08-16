/**
 * @since 0.0.1
 */
export type ArgsOf<A> = A extends (...args: infer R) => any ? R : never

/**
 * @since 0.0.1
 */
export type HeadArg<A> = ArgsOf<A>[0]

/**
 * @since 0.0.1
 */
export type Arity1<A = any, B = any> = (value: A) => B

/**
 * @since 0.0.1
 */
export type Arity2<A = any, B = any, C = any> = (a: A, b: B) => C

/**
 * @since 0.0.1
 */
export type Arity3<A = any, B = any, C = any, D = any> = (a: A, b: B, c: C) => D

/**
 * @since 0.0.1
 */
export type Arity4<A = any, B = any, C = any, D = any, E = any> = (a: A, b: B, c: C, d: D) => E

/**
 * @since 0.0.1
 */
export type Arity5<A = any, B = any, C = any, D = any, E = any, F = any> = (
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
) => F

export type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

export type IsNever<A> = Equals<A, never>
export type IsUnknown<A> = Equals<A, unknown>

export type NoInfer<T> = [T][T extends any ? 0 : never]

export const isBrowser: boolean = typeof window !== 'undefined' && typeof document !== 'undefined'
